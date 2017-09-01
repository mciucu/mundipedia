from django.contrib import admin
from django.contrib.auth.forms import AdminPasswordChangeForm
from django.contrib.auth.admin import UserAdmin

from .models import User


class MyUserAdmin(UserAdmin):
    add_form_template = 'admin/auth/user/add_form.html'
    change_user_password_template = None
    fieldsets = (
        (None, {"fields": ('email', 'password')}),
        ("Personal info", {'fields': ('first_name', 'last_name', 'username', 'country')}),
        ("Permissions", {'fields': ('is_active', 'is_staff', 'is_superuser', "chat_muted")}),
        ("Important dates", {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2'),
        }),
    )
    change_password_form = AdminPasswordChangeForm
    list_display = ('email', 'username', 'first_name', 'last_name', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-id',)
    filter_horizontal = ()


admin.site.register(User, MyUserAdmin)
