from rest_framework.permissions import BasePermission


class IsRecruiter(BasePermission):
    """
    Allows access only to authenticated users with the RECRUITER role.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_recruiter
        )


class IsCandidate(BasePermission):
    """
    Allows access only to authenticated users with the CANDIDATE role.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_candidate
        )
