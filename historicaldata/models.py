from django.contrib.gis.db import models

from establishment.funnel.stream import StreamObjectMixin


class MetaSourceType(StreamObjectMixin):
    desc = models.TextField(unique=True)


class MetaSource(models.Model):
    type = models.ForeignKey(MetaSourceType, related_name="+", on_delete=models.PROTECT)
    name = models.TextField()


class SourceType(models.Model):
    desc = models.TextField(unique=True)


class Source(StreamObjectMixin):
    type = models.ForeignKey(SourceType, related_name="+", on_delete=models.PROTECT)
    meta_source = models.ForeignKey(MetaSource, related_name="+", on_delete=models.PROTECT, null=True, blank=True)
    desc = models.TextField()
    url = models.URLField(null=True)


class EntityType(StreamObjectMixin):
    description = models.TextField(unique=True)

    def __str__(self):
        return "[" + str(self.id) + "] " + self.description


class Entity(StreamObjectMixin):
    """
    Model for storing an entity.
    This is the main data type and it includes all political entities, languages, etc.
    """
    type = models.ForeignKey(EntityType, related_name="+", on_delete=models.PROTECT)
    name = models.TextField()
    comment = models.TextField()
    legacy_id = models.IntegerField(unique=True, null=True, blank=True)

    def __str__(self):
        return "Entity " + str(self.id) + " [" + self.comment + "]"

    @classmethod
    def get_legacy(cls, legacy_id):
        return cls.objects.get(legacy_id=legacy_id)


class EventType(StreamObjectMixin):
    desc = models.TextField(unique=True)


class Event(StreamObjectMixin):
    """
    Model for an event in time
    That changes the properties on one or more entities
    """
    name = models.TextField()
    date_start = models.TextField()
    date_end = models.TextField(null=True)
    type = models.ForeignKey(EventType, related_name="+", null=True, on_delete=models.PROTECT)
    entity = models.ForeignKey(Entity, related_name="+", null=True, on_delete=models.PROTECT)
    comment = models.TextField(null=True)
    legacy_id = models.IntegerField(unique=True, null=True, blank=True)

    def __str__(self):
        return "Event " + str(self.id) + " [" + self.name +"]"

    #TODO: change to conversion to datetime, to be able to compare with date
    def __lt__(self, other):
        return self.get_date() < other.get_date()

    def __le__(self, other):
        return self.get_date() <= other.get_date()

    @staticmethod
    def parse_date(date_str):
        month_dict = {"Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5, "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11}
        parts = date_str.split()
        day = 0
        month = 0
        year = 0
        is_bc = False
        have_month = False
        for poz in range(len(parts)):
            parts[poz] = parts[poz].capitalize()
            if parts[poz] in month_dict:
                month = month_dict[parts[poz]]
                have_month = True
                #if poz > 0:
                day = int(parts[poz - 1])
                #if poz + 1 < len(parts):
                year = int(parts[poz + 1])

            if parts[poz].upper() == "BC":
                is_bc = True

        if not have_month:
            raise Exception("Don't understand date: " + date_str)

        if is_bc:
            year = -year - 1

        return day + month * 32 + year * 400

    def get_date(self):
        try:
            return Event.parse_date(self.date_start)
        except Exception as e:
            try:
                return Event.parse_date("1 Jan " + self.date_start)
            except:
                pass
            raise e


def first_after(values, date):
    rez = None
    date_value = Event.parse_date(date)
    for obj in values:
        if not (obj.get_date() <= date_value):
            continue
        if (not rez) or (rez.get_date() <= obj.get_date()):
            rez = obj
    return rez


class EntityProperty(StreamObjectMixin):
    entity = models.ForeignKey(Entity, related_name="+", on_delete=models.PROTECT)
    event = models.ForeignKey(Event, related_name="+", on_delete=models.PROTECT)
    comment = models.TextField(null=True)

    class Meta:
        abstract = True
        unique_together = ("entity", "event")

    def __le__(self, other):
        return self.is_before(other)

    def get_date(self):
        return self.event.get_date()

    def is_before(self, other):
        return self.event < other.event

    @classmethod
    def get_versions(cls, entity):
        rez = list(cls.objects.filter(entity=entity).select_related("event", "entity"))
        rez.sort(key=lambda o: o.event)
        return rez

    @classmethod
    def get(cls, entity, date):
        versions = cls.get_versions(entity)
        return first_after(versions, date)


class EntityPropertySourced(EntityProperty):
    source = models.ForeignKey(Source, related_name="+", on_delete=models.PROTECT)

    class Meta(EntityProperty.Meta):
        abstract = True


class Name(EntityProperty):
    value = models.TextField()
    lang_code_iso = models.CharField(max_length=5)
    is_official = models.BooleanField(default=False)
    is_own_language = models.BooleanField(default=False)


class EntityLanguage(EntityProperty):
    language = models.ForeignKey(Entity, related_name="+", on_delete=models.PROTECT)
    percent = models.FloatField(null=True)

    class Meta:
        unique_together = ()


class EntityScript(EntityProperty):
    script = models.ForeignKey(Entity, related_name="+", on_delete=models.PROTECT)


class EntityBorder(EntityPropertySourced):
    """
    Models for the borders of a specific entity
    """
    area = models.BigIntegerField(null=True, blank=True)
    perimeter = models.BigIntegerField(null=True, blank=True)
    centroid = models.PointField()
    geom = models.GeometryField()

    label_rank = models.IntegerField(null=True, blank=True)
    label_poz = models.MultiPointField(null=True, blank=True)


class EntityDemographics(EntityPropertySourced):
    value = models.BigIntegerField()

    def __str__(self):
        return self.entity.id + " - " + self.value


class EntityGDP(EntityPropertySourced):
    value = models.BigIntegerField()
    currency = models.ForeignKey(Entity, related_name="+", on_delete=models.PROTECT)


class GovernmentType(StreamObjectMixin):
    desc = models.TextField(unique=True)
    parent_type = models.ForeignKey("self", related_name="+", on_delete=models.PROTECT, null=True)


class EntityGovernment(EntityProperty):
    type = models.ForeignKey(GovernmentType, related_name="+", on_delete=models.PROTECT)


class ReligionDemographic(EntityProperty):
    religion = models.ForeignKey(Entity, related_name="+", on_delete=models.PROTECT)
    percentage = models.DecimalField(max_digits=7, decimal_places=4)

    class Meta:
        unique_together = ()


class EthnicDemographic(EntityPropertySourced):
    ethnic_group = models.ForeignKey(Entity, related_name="+", on_delete=models.PROTECT)
    percentage = models.DecimalField(null=False, max_digits=7, decimal_places=4)

    class Meta:
        unique_together = ()


class OfficialCurrency(EntityProperty):
    currency = models.ForeignKey(Entity, related_name="+", on_delete=models.PROTECT)
    symbol = models.CharField(max_length=2, null=True)

    def get_name(self):
        return self.currency.comment


class CapitalCity(EntityProperty):
    capital_city = models.ForeignKey(Entity, related_name="+", on_delete=models.PROTECT)


class EntityWikipedia(StreamObjectMixin):
    entity = models.ForeignKey(Entity, related_name="+", on_delete=models.PROTECT)
    url = models.URLField()


class EventWikipedia(StreamObjectMixin):
    event = models.ForeignKey(Event, related_name="+", on_delete=models.PROTECT)
    url = models.URLField()
