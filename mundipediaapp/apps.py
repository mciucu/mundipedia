from django.apps import AppConfig
from django.conf import settings


class MainAppConfig(AppConfig):
    name = "mundipediaapp"

    def ready(self):
        from mundipediaapp.utils import gather_public_state
        settings.PUBLIC_STATE_COLLECTORS.append(gather_public_state)
