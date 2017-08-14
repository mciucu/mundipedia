DEBUG = False

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = '7^b^xw9szx2+4!p%@f6cnfgl+xh_uh+5^lrjm)t_8=5tv=1&n0'

ALLOWED_HOSTS = ['']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': '',
        'USER': '',
        'PASSWORD': '',
        'HOST': '',
        'PORT': '',
        'CONN_MAX_AGE': 600,
    },
}