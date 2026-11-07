from django.test import SimpleTestCase

from apps.applications.services.matching_engine import (
    canonical_skill,
    compute_skill_overlap,
)


class SkillAliasTests(SimpleTestCase):
    def test_rest_variants_match_each_other(self):
        matching, missing, score = compute_skill_overlap(["REST API"], ["REST"])
        self.assertEqual(matching, ["REST API"])
        self.assertEqual(missing, [])
        self.assertEqual(score, 100.0)

        matching, _, _ = compute_skill_overlap(["REST"], ["RESTful APIs"])
        self.assertEqual(matching, ["REST"])

    def test_common_aliases(self):
        self.assertEqual(canonical_skill("Postgres"), canonical_skill("PostgreSQL"))
        self.assertEqual(canonical_skill("DRF"), canonical_skill("Django REST Framework"))
        self.assertEqual(canonical_skill("sklearn"), canonical_skill("Scikit-Learn"))
        self.assertEqual(canonical_skill("  Node JS ".replace(" JS", "js")), "node.js")

    def test_unrelated_skills_do_not_match(self):
        matching, missing, score = compute_skill_overlap(["REST API", "Docker"], ["Python", "React"])
        self.assertEqual(matching, [])
        self.assertEqual(missing, ["REST API", "Docker"])
        self.assertEqual(score, 0.0)

    def test_job_label_is_kept_in_results(self):
        matching, _, _ = compute_skill_overlap(["Postgres", "Git"], ["PostgreSQL", "Git"])
        self.assertEqual(matching, ["Postgres", "Git"])
