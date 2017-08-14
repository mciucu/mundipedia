from django.apps import AppConfig


class DemoAppConfig(AppConfig):
    name = "mundipediaapp"

    def ready(self):
        pass