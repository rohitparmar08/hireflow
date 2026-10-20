from rest_framework.permissions import BasePermission


class IsCandidate(BasePermission):
    """
    Grants access only to authenticated users with CANDIDATE role.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_candidate
        )


class IsApplicationParticipant(BasePermission):
    """
    Object-level permission allowing access to an application only if the user
    is the candidate who submitted it OR the recruiter who owns the job.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        return obj.candidate == user or obj.job.recruiter == user
