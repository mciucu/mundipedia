from django.contrib import admin

from .models import *

admin.site.register(EntityType)
admin.site.register(Entity)
admin.site.register(EventType)
admin.site.register(Event)
