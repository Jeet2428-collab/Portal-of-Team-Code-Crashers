from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

UserModel = get_user_model()

class EmailOrUsernameModelBackend(ModelBackend):
    """
    Custom authentication backend allowing authentication with:
    1. Case-insensitive Username (e.g., 'ltAdmin@teamcc', 'ltAdmin@teamCC', 'admin')
    2. Case-insensitive Email (e.g., 'ltAdmin@teamcc.org', 'subha.ibm.24@gmail.com')
    3. Membership ID (e.g., 'CC-ADMIN-01')
    
    Ensures seamless login for Django admin (/admin/) and DRF auth endpoints.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)
            
        if not username or not password:
            return None

        clean_identifier = username.strip()

        # 1. Search by case-insensitive username or email
        user = UserModel.objects.filter(
            Q(username__iexact=clean_identifier) | Q(email__iexact=clean_identifier)
        ).first()

        # 2. If not found, check if identifier is a Membership ID (e.g., CC-ADMIN-01)
        if not user:
            try:
                from teamcc.models import MembershipCard
                card = MembershipCard.objects.filter(
                    member_id__iexact=clean_identifier
                ).select_related('user').first()
                if card and card.user:
                    user = card.user
            except Exception:
                pass

        # 3. Verify password and active status
        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user

        return None
