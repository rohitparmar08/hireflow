import re
from typing import Any, Dict, List, Set, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Configurable Scoring Weights (Must sum to 1.0 / 100%)
DEFAULT_WEIGHTS = {
    "required_skills": 0.40,
    "optional_skills": 0.15,
    "text_similarity": 0.25,
    "experience_alignment": 0.10,
    "education_alignment": 0.10,
}

DISCLAIMER_TEXT = (
    "This score is calculated algorithmically using deterministic skill matching, "
    "experience indicators, and TF-IDF text similarity to assist human recruiters in screening. "
    "It does not assess soft skills, problem-solving ability, or past performance, "
    "and should not be used as the sole basis for hiring decisions."
)

SENIORITY_KEYWORDS = {
    "ENTRY": ["intern", "internship", "junior", "entry", "fresher", "trainee", "associate"],
    "MID": ["intermediate", "mid-level", "software engineer", "developer", "specialist"],
    "SENIOR": ["senior", "sr.", "lead", "principal", "expert", "specialist"],
    "LEAD": ["lead", "tech lead", "principal", "architect", "staff", "manager", "team lead"],
    "EXECUTIVE": ["director", "head of", "vp", "vice president", "chief", "cto", "cio", "executive"],
}

EDUCATION_TIERS = {
    "DOCTORATE": {"keywords": ["ph.d.", "phd", "doctorate"], "score": 100.0},
    "MASTER": {"keywords": ["master", "m.s.", "m.sc.", "m.tech", "mba"], "score": 95.0},
    "BACHELOR": {"keywords": ["bachelor", "b.s.", "b.sc.", "b.tech", "b.e."], "score": 85.0},
    "ASSOCIATE": {"keywords": ["associate degree", "associate", "diploma"], "score": 70.0},
}


def normalize_skills(skills: List[str]) -> List[str]:
    """
    Standardize skill tokens for reliable, case-insensitive comparison.
    Preserves unique skills in original capitalization order.
    """
    seen = set()
    cleaned = []
    for s in skills or []:
        s_clean = s.strip()
        if s_clean and s_clean.lower() not in seen:
            seen.add(s_clean.lower())
            cleaned.append(s_clean)
    return cleaned


def compute_skill_overlap(
    job_skills: List[str],
    resume_skills: List[str],
) -> Tuple[List[str], List[str], float]:
    """
    Calculates overlap between expected job skills and candidate's extracted skills.
    Returns: (matching_skills, missing_skills, score_0_to_100)
    """
    if not job_skills:
        # If no skills specified in job, no penalty is applied
        return [], [], 100.0

    resume_lookup = {s.lower(): s for s in resume_skills or []}
    matching = []
    missing = []

    for expected in job_skills:
        exp_clean = expected.strip()
        if not exp_clean:
            continue
        exp_lower = exp_clean.lower()
        if exp_lower in resume_lookup:
            matching.append(exp_clean)
        else:
            missing.append(exp_clean)

    total_expected = len(matching) + len(missing)
    if total_expected == 0:
        return [], [], 100.0

    score = round((len(matching) / total_expected) * 100.0, 1)
    return matching, missing, score


def compute_text_similarity(job_corpus: str, resume_corpus: str) -> Tuple[float, str]:
    """
    Computes TF-IDF cosine similarity between job requirements text and candidate resume text.
    Returns: (similarity_score_0_to_100, explanation_note)
    """
    job_text = (job_corpus or "").strip()
    resume_text = (resume_corpus or "").strip()

    if not job_text or not resume_text:
        return 0.0, "Insufficient text content in job description or resume to calculate similarity."

    try:
        vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            max_features=2500,
            token_pattern=r"(?u)\b[a-zA-Z0-9_.+#-]+\b",  # Handles C++, C#, .NET
        )
        tfidf_matrix = vectorizer.fit_transform([job_text, resume_text])
        similarity_val = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])
        score = round(max(0.0, min(1.0, similarity_val)) * 100.0, 1)
        return score, f"TF-IDF cosine similarity between job and resume text is {score}%."
    except Exception as exc:
        return 0.0, f"TF-IDF computation encountered an error: {str(exc)}"


def evaluate_experience_alignment(job_level: str, resume_text: str) -> Tuple[float, str]:
    """
    Evaluates alignment between job experience level and candidate resume indicators.
    Returns: (score_0_to_100, explanation_note)
    """
    if not job_level:
        return 75.0, "Job does not specify an experience level requirement."

    job_level_upper = job_level.upper()
    text_lower = (resume_text or "").lower()

    if not text_lower:
        return 50.0, "No resume text available to assess experience alignment."

    # Look for explicit years of experience in resume text (e.g., '5+ years of experience')
    exp_year_matches = re.findall(r"\b(\d{1,2})\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)?\b", text_lower)
    max_years = 0
    if exp_year_matches:
        try:
            max_years = max([int(y) for y in exp_year_matches if int(y) <= 40])
        except ValueError:
            max_years = 0

    # Check seniority keyword occurrences
    keywords_found = []
    for level, words in SENIORITY_KEYWORDS.items():
        for w in words:
            if re.search(r"\b" + re.escape(w) + r"\b", text_lower):
                keywords_found.append((level, w))
                break

    # Determine alignment based on target level
    if job_level_upper == "ENTRY":
        if max_years <= 2 or any(lvl == "ENTRY" for lvl, _ in keywords_found):
            return 100.0, "Candidate matches entry-level expectations."
        return 85.0, "Candidate has relevant experience suitable for entry-level opening."

    elif job_level_upper == "MID":
        if (2 <= max_years <= 6) or any(lvl in ["MID", "SENIOR"] for lvl, _ in keywords_found):
            return 100.0, "Candidate displays solid mid-level experience indicators."
        elif max_years > 6:
            return 90.0, "Candidate exceeds mid-level experience requirements."
        elif any(lvl == "ENTRY" for lvl, _ in keywords_found):
            return 60.0, "Candidate indicators lean junior for mid-level requirements."
        return 70.0, "General professional experience indicators observed."

    elif job_level_upper == "SENIOR":
        if max_years >= 5 or any(lvl in ["SENIOR", "LEAD"] for lvl, _ in keywords_found):
            return 100.0, "Candidate demonstrates senior-level experience and seniority markers."
        elif max_years >= 3 or any(lvl == "MID" for lvl, _ in keywords_found):
            return 65.0, "Candidate exhibits intermediate experience; progression to senior expected."
        return 40.0, "Limited senior-level indicators detected in resume."

    elif job_level_upper in ["LEAD", "EXECUTIVE"]:
        if max_years >= 7 or any(lvl in ["LEAD", "EXECUTIVE"] for lvl, _ in keywords_found):
            return 100.0, f"Candidate displays leadership and {job_level.lower()} tier markers."
        elif any(lvl == "SENIOR" for lvl, _ in keywords_found) or max_years >= 5:
            return 70.0, "Senior qualifications detected; partial leadership alignment."
        return 35.0, f"Limited executive/lead markers detected for {job_level.lower()} role."

    return 60.0, "Experience alignment could not be definitively categorized; neutral score assigned."


def evaluate_education_alignment(resume_education: List[str], resume_text: str) -> Tuple[float, str]:
    """
    Evaluates education credentials from parsed data and raw text.
    Returns: (score_0_to_100, explanation_note)
    """
    edu_list = [e.lower() for e in (resume_education or [])]
    text_lower = (resume_text or "").lower()

    for tier_name, tier_info in EDUCATION_TIERS.items():
        for kw in tier_info["keywords"]:
            if any(kw in e for e in edu_list) or re.search(r"\b" + re.escape(kw) + r"\b", text_lower):
                return tier_info["score"], f"Highest detected credential aligns with {tier_name.capitalize()} degree level."

    if not text_lower:
        return 0.0, "No resume content available to assess education credentials."

    return 55.0, "No specific degree keywords conclusively identified; baseline assigned."


def calculate_match_breakdown(
    job_posting: Any,
    resume_instance: Any,
    cover_note: str = "",
    weights: Dict[str, float] = None,
) -> Dict[str, Any]:
    """
    Core matching engine function. Compares JobPosting requirements against
    the candidate's Resume extracted data and raw text.

    Returns a rich, transparent, explainable scoring breakdown dictionary.
    Deterministic, zero external APIs, robust against missing or corrupted fields.
    """
    weights = weights or DEFAULT_WEIGHTS

    # 1. Guard against missing or unparsed resume
    if not resume_instance or not hasattr(resume_instance, "raw_text"):
        return {
            "overall_score": 0.0,
            "skills_score": 0.0,
            "similarity_score": 0.0,
            "experience_score": 0.0,
            "education_score": 0.0,
            "matching_skills": [],
            "missing_skills": job_posting.required_skills if job_posting else [],
            "breakdown": {
                "weights": weights,
                "components": {},
                "status": "FAILED",
                "error": "No resume file or extracted text available for this application.",
                "disclaimer": DISCLAIMER_TEXT,
            },
        }

    raw_text = resume_instance.raw_text or ""
    parsed_data = resume_instance.parsed_data or {}
    detected_skills = parsed_data.get("skills", [])
    detected_education = parsed_data.get("education", [])

    # If parsing failed or resume text is completely empty
    if not raw_text.strip():
        all_job_skills = list(set((job_posting.required_skills or []) + (job_posting.optional_skills or [])))
        return {
            "overall_score": 0.0,
            "skills_score": 0.0,
            "similarity_score": 0.0,
            "experience_score": 0.0,
            "education_score": 0.0,
            "matching_skills": [],
            "missing_skills": all_job_skills,
            "breakdown": {
                "weights": weights,
                "components": {},
                "status": "UNREADABLE",
                "error": "Resume document contained no extractable text.",
                "disclaimer": DISCLAIMER_TEXT,
            },
        }

    # 2. Extract job fields
    job_title = job_posting.title if job_posting else ""
    job_description = job_posting.description if job_posting else ""
    required_skills = normalize_skills(job_posting.required_skills if job_posting else [])
    optional_skills = normalize_skills(job_posting.optional_skills if job_posting else [])
    experience_level = job_posting.experience_level if job_posting else "MID"

    # 3. Component A: Required Skills Match
    req_match, req_miss, req_score = compute_skill_overlap(required_skills, detected_skills)

    # 4. Component B: Optional Skills Match
    opt_match, opt_miss, opt_score = compute_skill_overlap(optional_skills, detected_skills)

    # Blended skills score (proportional to weights of required & optional skills)
    # Required skills are 40% of total score, optional are 15%
    combined_skills_score = round(
        (req_score * (weights["required_skills"] / (weights["required_skills"] + weights["optional_skills"])))
        + (opt_score * (weights["optional_skills"] / (weights["required_skills"] + weights["optional_skills"]))),
        1,
    )

    # 5. Component C: TF-IDF Text Similarity
    # Build complete job text corpus
    job_corpus_parts = [job_title, job_description]
    if required_skills:
        job_corpus_parts.append("Required Skills: " + ", ".join(required_skills))
    if optional_skills:
        job_corpus_parts.append("Optional Skills: " + ", ".join(optional_skills))
    job_corpus = "\n".join(job_corpus_parts)

    # Candidate corpus includes raw resume text and any submitted cover note
    candidate_corpus = raw_text
    if cover_note and cover_note.strip():
        candidate_corpus += "\n\nCandidate Statement:\n" + cover_note.strip()

    sim_score, sim_note = compute_text_similarity(job_corpus, candidate_corpus)

    # 6. Component D: Experience Level Alignment
    exp_score, exp_note = evaluate_experience_alignment(experience_level, candidate_corpus)

    # 7. Component E: Education Level Alignment
    edu_score, edu_note = evaluate_education_alignment(detected_education, candidate_corpus)

    # 8. Compute Weighted Overall Score
    weighted_total = (
        (req_score * weights["required_skills"])
        + (opt_score * weights["optional_skills"])
        + (sim_score * weights["text_similarity"])
        + (exp_score * weights["experience_alignment"])
        + (edu_score * weights["education_alignment"])
    )
    overall_score = round(max(0.0, min(100.0, weighted_total)), 1)

    all_matching = list(dict.fromkeys(req_match + opt_match))
    all_missing = list(dict.fromkeys(req_miss + opt_miss))

    components_breakdown = {
        "required_skills": {
            "weight_pct": int(weights["required_skills"] * 100),
            "score": req_score,
            "contribution": round(req_score * weights["required_skills"], 1),
            "matching": req_match,
            "missing": req_miss,
            "total_expected": len(required_skills),
            "matched_count": len(req_match),
            "note": f"Matched {len(req_match)} of {len(required_skills)} must-have technical skills." if required_skills else "No mandatory skills required by job.",
        },
        "optional_skills": {
            "weight_pct": int(weights["optional_skills"] * 100),
            "score": opt_score,
            "contribution": round(opt_score * weights["optional_skills"], 1),
            "matching": opt_match,
            "missing": opt_miss,
            "total_expected": len(optional_skills),
            "matched_count": len(opt_match),
            "note": f"Matched {len(opt_match)} of {len(optional_skills)} nice-to-have skills." if optional_skills else "No optional skills listed.",
        },
        "text_similarity": {
            "weight_pct": int(weights["text_similarity"] * 100),
            "score": sim_score,
            "contribution": round(sim_score * weights["text_similarity"], 1),
            "note": sim_note,
        },
        "experience_alignment": {
            "weight_pct": int(weights["experience_alignment"] * 100),
            "score": exp_score,
            "contribution": round(exp_score * weights["experience_alignment"], 1),
            "target_level": experience_level,
            "note": exp_note,
        },
        "education_alignment": {
            "weight_pct": int(weights["education_alignment"] * 100),
            "score": edu_score,
            "contribution": round(edu_score * weights["education_alignment"], 1),
            "detected_degrees": detected_education,
            "note": edu_note,
        },
    }

    return {
        "overall_score": overall_score,
        "skills_score": combined_skills_score,
        "similarity_score": sim_score,
        "experience_score": exp_score,
        "education_score": edu_score,
        "matching_skills": all_matching,
        "missing_skills": all_missing,
        "breakdown": {
            "weights": {k: int(v * 100) for k, v in weights.items()},
            "components": components_breakdown,
            "missing_required_skills": req_miss,
            "missing_optional_skills": opt_miss,
            "disclaimer": DISCLAIMER_TEXT,
        },
    }


def compute_and_save_match(application_instance: Any) -> Any:
    """
    Executes matching analysis for an Application and persists the result
    in a JobApplicationMatch record.
    """
    from apps.applications.models import JobApplicationMatch

    job = application_instance.job
    resume = getattr(application_instance, "resume", None)
    cover_note = application_instance.cover_note or ""

    result = calculate_match_breakdown(
        job_posting=job,
        resume_instance=resume,
        cover_note=cover_note,
    )

    match_record, _ = JobApplicationMatch.objects.update_or_create(
        application=application_instance,
        defaults={
            "overall_score": result["overall_score"],
            "skills_score": result["skills_score"],
            "similarity_score": result["similarity_score"],
            "experience_score": result["experience_score"],
            "education_score": result["education_score"],
            "matching_skills": result["matching_skills"],
            "missing_skills": result["missing_skills"],
            "breakdown": result["breakdown"],
        },
    )
    return match_record
