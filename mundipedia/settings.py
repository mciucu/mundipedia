"""
Django settings for mundipedia project.

Generated by 'stem-app create' using Django 1.11.

For more information on this file, see
https://docs.djangoproject.com/en/1.11/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.11/ref/settings/
"""

import os

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import traceback

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
PROJECT_ROOT = os.path.normpath(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# Quick-start development settings - unsuitable for production
# Recommendations at csacademy/docs/stem-app/recommended-settings
# Django docs: https://docs.djangoproject.com/en/1.11/howto/deployment/checklist/

# SECURITY WARNING!
# If you run this codebase in production, make sure to protect this key, using one that's not in the codebase
SECRET_KEY = '7^b^xw9szx2+4!p%@f6cnfgl+xh_uh+5^lrjm)t_8=5tv=1&n0'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = ["*"]

ADMINS = []

AUTH_USER_MODEL = "mundipediaapp.User"

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    "django.contrib.sitemaps",
    "django.contrib.sites",

    "establishment.accounts",
    "establishment.socialaccount",
    "establishment.localization",
    "establishment.errors",
    "establishment.content",
    "establishment.baseconfig",
    "establishment.documentation",
    "establishment.chat",
    "establishment.blog",
    "establishment.forum",
    "establishment.misc",
    "establishment.webapp",

    "mundipediaapp",
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',

    "establishment.funnel.middleware.VisitorMiddleware",
    "establishment.webapp.middleware.ProcessResponseMiddleware",
    "establishment.errors.middleware.ErrorMessageProcessingMiddleware",
]

ROOT_URLCONF = 'mundipedia.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                "establishment.webapp.context_processors.websocket_url",
                "establishment.webapp.context_processors.user_json",
                "mundipediaapp.context_processor.default",
            ],
        },
    },
]

PUBLIC_STATE_COLLECTORS = [
    "establishment.baseconfig.utils.export_to_public_state"
]

PUBLIC_STATE_PATHS = [
    (
        os.path.join(PROJECT_ROOT, "mundipediaapp/templates/PublicState.jstemplate"),
        os.path.join(PROJECT_ROOT, "mundipediaapp/static/js/PublicState.js")
    ),
]

AUTHENTICATION_BACKENDS = (
    # Needed to login by username in Django admin, regardless of `accounts`
    "django.contrib.auth.backends.ModelBackend",
    # `accounts` specific authentication methods, such as login by e-mail
    "establishment.accounts.auth_backends.AuthenticationBackend",
)

SOCIAL_ACCOUNT_PROVIDERS = {
    "google": {
        "SCOPE": ["profile", "email"],
        "AUTH_PARAMS": {
            "access_type": "online"
        }
    },
    "facebook": {
        "SCOPE": ["email"],
        "METHOD": "oauth2",
        "VERIFIED_EMAIL": True,
        "VERSION": "v2.7"
    }
}

WSGI_APPLICATION = 'mundipedia.wsgi.application'


SESSION_ENGINE = "redis_sessions.session"
SESSION_REDIS_PREFIX = "session"
SESSION_REDIS_SOCKET_TIMEOUT = 1.0

# Database configuration
# By default empty, needs to be specified in local_settings.py
# https://docs.djangoproject.com/en/1.11/ref/settings/#databases
DATABASES = {
}


REDIS_CONNECTION = {
    "host": "localhost",
    "port": 6379,
    "db": 0,
    "password": None,
}

REDIS_CONNECTION_WEBSOCKETS = REDIS_CONNECTION
REDIS_CONNECTION_CACHING = REDIS_CONNECTION
REDIS_CONNECTION_LOGGING = REDIS_CONNECTION
REDIS_CONNECTION_SERVICES = REDIS_CONNECTION
REDIS_CONNECTION_JOBS = REDIS_CONNECTION


DEFAULT_HTTP_PROTOCOL = "https"
EMAIL_CONFIRMATION_EXPIRE_DAYS = 3
SESSION_COOKIE_AGE = 60 * 60 * 24 * 7 * 3


# Password validation
# https://docs.djangoproject.com/en/1.11/ref/settings/#auth-password-validators

# AUTH_PASSWORD_VALIDATORS = [
#     {
#         'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
#     },
#     {
#         'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
#     },
#     {
#         'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
#     },
#     {
#         'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
#     },
# ]


# Internationalization
# https://docs.djangoproject.com/en/1.11/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.11/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, "static/")

SITE_ID = 1

try:
    from .local_settings import *
except Exception as e:
    print("Failed to load local_settings!\n", format(e), "\n" + traceback.format_exc())