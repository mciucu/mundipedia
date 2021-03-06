import psycopg2
import os, django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mundipedia.settings")
django.setup()

from historicaldata.models import *

try:
    conn = psycopg2.connect("dbname='mundiback' user='postgres' host='127.0.0.1' password='postgres'")
except:
    print("I am unable to connect to the database")

print("Connected to database")


class DBObject(object):
    def __init__(self, cursor, row):
        for (attr, val) in zip((d[0] for d in cursor.description), row):
            setattr(self, attr, val)


def ensure_minimum_exists():
    #src = Source.get_or_create(id=1, defaults={})
    pass


def ensure_entity_types_exist():
    TYPES = [
        "State",
        "City",
        "Ethnicity",
        "Religion",
        "Language",
        "Language Family",
        "Script",
        "Epidemic",
        "Currency",
    ]

    for entity_type_name in TYPES:
        entity_type, created = EntityType.objects.get_or_create(description=entity_type_name)


def load_entities_from_db():
    print("Inserting entities")
    type_converter = {}
    type_converter[1] = type_converter[8] = type_converter[9] = type_converter[11] = type_converter[12] = 1 #state
    type_converter[2] = type_converter[13] = 2 #city
    type_converter[10] = 3 # people
    type_converter[3] = 4 # religion
    type_converter[6] = 5 # language
    type_converter[7] = 6 # Language family
    type_converter[5] = 7 #script (writing system)
    type_converter[4] = 8 #epidemic
    type_converter[14] = 9 #currency
    type_converter[15] = 1 #those liberation guys

    ensure_entity_types_exist()

    cur = conn.cursor()

    cur.execute("""SELECT * from entities order by \"ID\"""")
    entities_db = cur.fetchall()

    for entity_old in entities_db:
        entity_id = int(entity_old[0])
        entity_type = int(entity_old[2])

        print(entity_old)

        entity_type = EntityType.objects.get(id=type_converter[entity_type])
        entity, created = Entity.objects.get_or_create(legacy_id=entity_id, defaults={
            "type": entity_type,
            "comment": entity_old[1].strip(),
        })
        if created:
            print("Created entity: ", entity.__dict__)


def fix_event_date(event):
    event_date_dict = {
        77: "1 Jan 811 BC",
        1911: "22 Apr 1889",
        2722: "1 Jan 1975",
        3493: "1 Jan 1988",
        4313: "1 Apr 1979",
        4386: "2 Mar 1864",
    }

    try:
        event.get_date()  # Test consistency
    except:
        print("Bad date for event " + str(event.legacy_id) + " - " + event.date_start)
        event.date_start = event_date_dict[event.legacy_id]

    event.get_date()


def load_events_from_db():
    print("Inserting events")
    cur = conn.cursor()

    cur.execute("""SELECT * from events order by \"ID\"""")
    events_db = cur.fetchall()

    EventType.objects.get_or_create(desc="Map snapshot")
    source_type, created = SourceType.objects.get_or_create(desc="Mundipedia")
    Source.objects.get_or_create(type=source_type, desc="Mundipedia", url="https://mundipedia.org/")

    for event_old in events_db:
        event_obj = DBObject(cur, event_old)
        #print(event_old)
        ev_id = event_old[0]
        ev_name = event_old[1]
        ev_start = event_old[2]
        ev_entity = None
        if event_old[3]:
            try:
                ev_entity = Entity.get_legacy(event_obj.EntityID)
            except:
                print("WARNING: Missing entity with id = " + str(event_obj.EntityID) + " for event = " + str(ev_id))
                continue
        ev_type = None
        ev_end = event_old[5]
        ev_comm = event_old[6]
        if ev_comm:
            ev_comm = ev_comm.strip()

        if not ev_start:
            print("WARNING: Missing start date for event " + str(ev_id), event_old)
            continue

        new_ev, created = Event.objects.get_or_create(legacy_id=ev_id, defaults={
            "name": ev_name,
            "type": ev_type,
            "date_start": ev_start,
            "date_end": ev_end,
            "entity": ev_entity,
            "comment": ev_comm
        })
        new_ev.name = ev_name
        new_ev.date_start = ev_start
        new_ev.date_end = ev_end
        new_ev.entity = ev_entity
        new_ev.comment = ev_comm

        fix_event_date(new_ev)

        new_ev.save()


def load_names_from_db():
    cur = conn.cursor()

    cur.execute("""SELECT * from names order by \"ID\"""")
    names_db = cur.fetchall()
    for row in names_db:
        name_db = DBObject(cur, row)
        if not name_db.ISO:
            name_db.ISO = "en"
        name_db.ISO = name_db.ISO.strip()

        if len(name_db.ISO) > 3:
            print("Invalid language code for name with ID " + str(name_db.ID) + ": " + str(name_db.ISO))
            continue

        try:
            name_db.entity = Entity.objects.get(legacy_id=name_db.EntityID)
        except:
            print("Can't find entity " + str(name_db.EntityID) + " for name with id " + str(name_db.ID))
            continue
        try:
            name_db.event = Event.objects.get(legacy_id=name_db.EventID)
        except:
            print("Can't find event " + str(name_db.EventID) + " for name with id " + str(name_db.ID))
            continue

        name = Name.objects.get_or_create(entity=name_db.entity, event=name_db.event)[0]

        name.value = name_db.Description
        name.is_own_language = (name_db.ISO != "en")
        name.lang_code_iso = name_db.ISO
        name.save()


def load_official_currency():
    print("Loading official currency")
    cur = conn.cursor()

    cur.execute("""SELECT * from official_currency order by \"ID\"""")
    for row in cur.fetchall():
        official_currency_db = DBObject(cur, row)

        try:
            official_currency_db.entity = Entity.objects.get(legacy_id=official_currency_db.EntityID)
        except:
            print("Missing entity id = " + str(official_currency_db.EntityID) + " for currency id = " + str(official_currency_db.ID))
            continue

        try:
            official_currency_db.event = Event.objects.get(legacy_id=official_currency_db.EventID)
        except:
            print("Missing event id = " + str(official_currency_db.EventID) + " for currency id = " + str(official_currency_db.ID))
            continue

        try:
            official_currency_db.currency = Entity.objects.get(legacy_id=official_currency_db.CurrencyID)
        except:
            print("Missing currency obj id = " + str(official_currency_db.CurrencyID) + " for currency id = " + str(official_currency_db.ID))
            continue

        obj = OfficialCurrency.objects.get_or_create(entity=official_currency_db.entity, event=official_currency_db.event, defaults={"currency": official_currency_db.currency})[0]
        obj.currency = official_currency_db.currency
        obj.save()


def load_gov():
    print("Loading gov types")
    cur = conn.cursor()

    cur.execute("""SELECT * from gov_codes order by \"ID\"""")
    for row in cur.fetchall():
        gov_obj = DBObject(cur, row)
        gov_type = GovernmentType.objects.get_or_create(id=gov_obj.ID, defaults={"desc": gov_obj.Description})[0]
        gov_type.desc = gov_obj.Description
        gov_type.save()

    print("Loading gov properties")
    cur = conn.cursor()

    cur.execute("""SELECT * from government order by \"ID\"""")
    for row in cur.fetchall():
        gov_obj = DBObject(cur, row)

        try:
            gov_obj.entity = Entity.objects.get(legacy_id=gov_obj.EntityID)
        except:
            print("Missing entity id = " + str(gov_obj.EntityID) + " for gov prop id = " + str(gov_obj.ID))
            continue

        try:
            gov_obj.event = Event.objects.get(legacy_id=gov_obj.EventID)
        except:
            print("Missing event id = " + str(gov_obj.EventID) + " for gov prop id = " + str(gov_obj.ID))
            continue

        try:
            gov_obj.gov = GovernmentType.objects.get(id=gov_obj.GovType)
        except:
            print("Missing gov obj id = " + str(gov_obj.GovType) + " for gov prop id = " + str(gov_obj.ID))
            continue

        gov = EntityGovernment.objects.get_or_create(entity=gov_obj.entity, event=gov_obj.event, defaults={"type": gov_obj.gov})[0]
        gov.type = gov_obj.gov
        gov.save()


def load_religious_information():
    print("Loading religious demographics")
    cur = conn.cursor()

    cur.execute("""SELECT * from official_religion order by \"ID\"""")
    for row in cur.fetchall():
        religion_obj = DBObject(cur, row)

        try:
            religion_obj.entity = Entity.objects.get(legacy_id=religion_obj.EntityID)
        except:
            print("Missing entity id = " + str(religion_obj.EntityID) + " for religion prop id = " + str(religion_obj.ID))
            continue

        try:
            religion_obj.event = Event.objects.get(legacy_id=religion_obj.EventID)
        except:
            print("Missing event id = " + str(religion_obj.EventID) + " for religion prop id = " + str(religion_obj.ID))
            continue

        try:
            religion_obj.rel = Entity.objects.get(legacy_id=religion_obj.ReligionID)
        except:
            print("Missing religion obj id = " + str(religion_obj.ReligionID) + " for religion prop id = " + str(religion_obj.ID))
            continue

        religion_info = ReligionDemographic.objects.get_or_create(event = religion_obj.event, entity = religion_obj.entity, religion=religion_obj.rel, defaults={"percentage": religion_obj.Percentage})[0]
        religion_info.percentage = religion_obj.Percentage
        religion_info.save()


def load_demographics():
    print("Loading  demographics")
    cur = conn.cursor()

    cur.execute("""SELECT * from demography order by \"ID\"""")

    for row in cur.fetchall():
        pop_obj = DBObject(cur, row)
        #print(pop_obj.__dict__)

        # try:
        #     religion_obj.entity = Entity.objects.get(legacy_id=religion_obj.EntityID)
        # except:
        #     print("Missing entity id = " + str(religion_obj.EntityID) + " for religion prop id = " + str(religion_obj.ID))
        #     continue
        #
        # try:
        #     religion_obj.event = Event.objects.get(legacy_id=religion_obj.EventID)
        # except:
        #     print("Missing event id = " + str(religion_obj.EventID) + " for religion prop id = " + str(religion_obj.ID))
        #     continue
        #
        # try:
        #     religion_obj.rel = Entity.objects.get(legacy_id=religion_obj.ReligionID)
        # except:
        #     print("Missing religion obj id = " + str(religion_obj.ReligionID) + " for religion prop id = " + str(religion_obj.ID))
        #     continue
        #
        # religion_info = ReligionDemographic.objects.get_or_create(event = religion_obj.event, entity = religion_obj.entity, religion=religion_obj.rel, defaults={"percentage": religion_obj.Percentage})[0]
        # religion_info.percentage = religion_obj.Percentage
        # religion_info.save()


def load_official_language():
    print("Loading official language info")
    cur = conn.cursor()

    cur.execute("""SELECT * from official_language order by \"ID\"""")
    for row in cur.fetchall():
        lang_obj = DBObject(cur, row)

        try:
            lang_obj.entity = Entity.objects.get(legacy_id=lang_obj.EntityID)
        except:
            print("Missing entity id = " + str(lang_obj.EntityID) + " for language prop id = " + str(lang_obj.ID))
            continue

        try:
            lang_obj.event = Event.objects.get(legacy_id=lang_obj.EventID)
        except:
            print("Missing event id = " + str(lang_obj.EventID) + " for language prop id = " + str(lang_obj.ID))
            continue

        try:
            lang_obj.lang = Entity.objects.get(legacy_id=lang_obj.LanguageID)
        except:
            print("Missing lang obj id = " + str(lang_obj.LanguageID) + " for religion prop id = " + str(lang_obj.ID))
            continue

        print(lang_obj.entity, lang_obj.event, lang_obj.lang)

        lang_info, created = EntityLanguage.objects.get_or_create(entity=lang_obj.entity, event=lang_obj.event, language=lang_obj.lang)
        lang_info.percentage = None
        lang_info.save()


def load_official_script():
    print("Not implemented")


load_entities_from_db()
load_events_from_db()
load_names_from_db()
load_official_currency()
load_official_language()
load_official_script()
load_gov()
load_religious_information()
load_demographics()
load_official_script()

