from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsJobOwner(BasePermission):
    """
    Object-level permission allowing only the recruiter who created the job
    to edit, update, or archive it.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_recruiter)

    def has_object_permission(self, request, view, obj):
        # Read-only permissions can be handled separately depending on view logic
        return obj.recruiter == request.user
