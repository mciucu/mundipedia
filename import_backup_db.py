import psycopg2
import os, django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mundipedia.settings")
django.setup()

try:
    conn = psycopg2.connect("dbname='mundiback' user='postgres' host='127.0.0.1' password='postgres'")
except:
    print("I am unable to connect to the database")

print("Connected to database")


class DBObj(object):
    def __init__(self, cursor, registro):
        for (attr, val) in zip((d[0] for d in cursor.description), registro) :
            setattr(self, attr, val)


def ensure_minimum_exists():
    #src = Source.get_or_create(id=1, defaults={})
    pass

def load_entities_from_db():
    print("Inserting entities")
    type_converter = {}
    type_converter[1] = type_converter[8] = type_converter[9] = type_converter[11] = type_converter[12] = 1 #state
    type_converter[2] = type_converter[13] = 2 #city
    type_converter[10] = 3 #people
    type_converter[3] = 4 #religion
    type_converter[6] = 5 #language
    type_converter[7] = 6
    type_converter[5] = 7 #script (writing system)
    type_converter[4] = 8 #epidemic
    type_converter[14] = 9 #currency
    type_converter[15] = 1 #those liberation guys

    cur = conn.cursor()

    cur.execute("""SELECT * from entities order by \"ID\"""")
    entities_db = cur.fetchall()

    for entity_old in entities_db:
        entity_db = DBObj(cur, entity_old)
        entity_type = int(entity_old[2])

        if not (entity_type in type_converter):
            print("Skipping entity type " + str(entity_type) + " ent: ",entity_old)
            continue


        # ent_type = EntityType.objects.get(id=type_converter[entity_type])
        # entity = Entity.objects.get_or_create(id=entity_old[0], defaults={"type": ent_type, "comment": entity_old[1].strip()})[0]
        # entity.type = ent_type
        # entity.comment = entity_old[1].strip()
        # entity.save()
        # print("Inserting " + str(entity_old[0]))
        # entity.type =
        # entity.comment =
        # entity.save()


def load_events_from_db():
    print("Inserting events")
    cur = conn.cursor()

    cur.execute("""SELECT * from events""")
    events_db = cur.fetchall()

    for event_old in events_db:
        #ev_obj = DBObj(event_old, cur)
        #print(event_old)
        ev_id = event_old[0]
        ev_name = event_old[1]
        ev_start = event_old[2]
        ev_entity = None
        if event_old[3]:
            try:
                ev_entity = Entity.objects.get(id=event_old[3])
            except:
                print("WARNING: Missing entity with id = " + str(event_old[3]) + " for event = " + str(ev_id))
                continue
        ev_type = None
        if event_old[4]:
            ev_type = EventType.objects.get(id=event_old[4])
        ev_end = event_old[5]
        ev_comm = event_old[6]
        if ev_comm:
            ev_comm = ev_comm.strip()

        if not ev_start:
            print("WARNING: Missing start date for event " + str(ev_id))
            continue

        new_ev = Event.objects.get_or_create(id=ev_id, defaults={"name": ev_name, "type": ev_type, "date_start": ev_start, "date_end": ev_end, "entity": ev_entity, "comment": ev_comm})[0]
        new_ev.name = ev_name
        new_ev.type = ev_type
        new_ev.date_start = ev_start
        new_ev.date_end = ev_end
        new_ev.entity = ev_entity
        new_ev.comment = ev_comm
        new_ev.save()

        try:
            new_ev.get_date() #test de consistenta
        except:
            print("Bad date for event " + str(new_ev.id) + " - " + new_ev.date_start)
        #new_ev.save()


def load_names_from_db():
    cur = conn.cursor()

    cur.execute("""SELECT * from names""")
    names_db = cur.fetchall()
    for row in names_db:
        name_db = DBObj(cur, row)
        if not name_db.ISO:
            name_db.ISO = "en"
        name_db.ISO = name_db.ISO.strip()

        if len(name_db.ISO) > 3:
            print("Invalid language code for name with ID " + str(name_db.ID) + ": " + str(name_db.ISO))
            continue

        try:
            name_db.entity = Entity.objects.get(id = name_db.EntityID)
        except:
            print("Can't find entity " + str(name_db.EntityID) + " for name with id " + str(name_db.ID))
            continue
        try:
            name_db.event = Event.objects.get(id=name_db.EventID)
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

    cur.execute("""SELECT * from official_currency""")
    for row in cur.fetchall():
        official_currency_db = DBObj(cur, row)

        try:
            official_currency_db.entity = Entity.objects.get(id=official_currency_db.EntityID)
        except:
            print("Missing entity id = " + str(official_currency_db.EntityID) + " for currency id = " + str(official_currency_db.ID))
            continue

        try:
            official_currency_db.event = Event.objects.get(id=official_currency_db.EventID)
        except:
            print("Missing event id = " + str(official_currency_db.EventID) + " for currency id = " + str(official_currency_db.ID))
            continue

        try:
            official_currency_db.currency = Entity.objects.get(id=official_currency_db.CurrencyID)
        except:
            print("Missing currency obj id = " + str(official_currency_db.CurrencyID) + " for currency id = " + str(official_currency_db.ID))
            continue

        obj = OfficialCurrency.objects.get_or_create(entity=official_currency_db.entity, event=official_currency_db.event, defaults={"currency": official_currency_db.currency})[0]
        obj.currency = official_currency_db.currency
        obj.save()


def load_gov():
    print("Loading gov types")
    cur = conn.cursor()

    cur.execute("""SELECT * from gov_codes""")
    for row in cur.fetchall():
        gov_obj = DBObj(cur, row)
        gov_type = GovernmentType.objects.get_or_create(id=gov_obj.ID, defaults={"desc": gov_obj.Description})[0]
        gov_type.desc = gov_obj.Description
        gov_type.save()

    print("Loading gov properties")
    cur = conn.cursor()

    cur.execute("""SELECT * from government""")
    for row in cur.fetchall():
        gov_obj = DBObj(cur, row)

        try:
            gov_obj.entity = Entity.objects.get(id=gov_obj.EntityID)
        except:
            print("Missing entity id = " + str(gov_obj.EntityID) + " for gov prop id = " + str(gov_obj.ID))
            continue

        try:
            gov_obj.event = Event.objects.get(id=gov_obj.EventID)
        except:
            print("Missing event id = " + str(gov_obj.EventID) + " for gov prop id = " + str(gov_obj.ID))
            continue

        try:
            gov_obj.gov = GovernmentType.objects.get(id=gov_obj.GovType)
        except:
            print("Missing gov obj id = " + str(gov_obj.GovType) + " for gov prop id = " + str(gov_obj.ID))
            continue

        gov = Government.objects.get_or_create(entity=gov_obj.entity, event=gov_obj.event, defaults={"type": gov_obj.gov})[0]
        gov.type = gov_obj.gov
        gov.save()



def load_religious_information():
    print("Loading religious demographics")
    cur = conn.cursor()

    cur.execute("""SELECT * from official_religion""")
    for row in cur.fetchall():
        religion_obj = DBObj(cur, row)

        try:
            religion_obj.entity = Entity.objects.get(id=religion_obj.EntityID)
        except:
            print("Missing entity id = " + str(religion_obj.EntityID) + " for religion prop id = " + str(religion_obj.ID))
            continue

        try:
            religion_obj.event = Event.objects.get(id=religion_obj.EventID)
        except:
            print("Missing event id = " + str(religion_obj.EventID) + " for religion prop id = " + str(religion_obj.ID))
            continue

        try:
            religion_obj.rel = Entity.objects.get(id=religion_obj.ReligionID)
        except:
            print("Missing religion obj id = " + str(religion_obj.ReligionID) + " for religion prop id = " + str(religion_obj.ID))
            continue

        religion_info = ReligionDemographic.objects.get_or_create(event = religion_obj.event, entity = religion_obj.entity, religion=religion_obj.rel, defaults={"percentage": religion_obj.Percentage})[0]
        religion_info.percentage = religion_obj.Percentage
        religion_info.save()

def load_demographics():
    print("Loading  demographics")
    cur = conn.cursor()

    cur.execute("""SELECT * from demography""")

    for row in cur.fetchall():
        pop_obj = DBObj(cur, row)
        #print(pop_obj.__dict__)

        # try:
        #     religion_obj.entity = Entity.objects.get(id=religion_obj.EntityID)
        # except:
        #     print("Missing entity id = " + str(religion_obj.EntityID) + " for religion prop id = " + str(religion_obj.ID))
        #     continue
        #
        # try:
        #     religion_obj.event = Event.objects.get(id=religion_obj.EventID)
        # except:
        #     print("Missing event id = " + str(religion_obj.EventID) + " for religion prop id = " + str(religion_obj.ID))
        #     continue
        #
        # try:
        #     religion_obj.rel = Entity.objects.get(id=religion_obj.ReligionID)
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

    cur.execute("""SELECT * from official_language""")
    for row in cur.fetchall():
        lang_obj = DBObj(cur, row)

        try:
            lang_obj.entity = Entity.objects.get(id=lang_obj.EntityID)
        except:
            print("Missing entity id = " + str(lang_obj.EntityID) + " for language prop id = " + str(lang_obj.ID))
            continue

        try:
            lang_obj.event = Event.objects.get(id=lang_obj.EventID)
        except:
            print("Missing event id = " + str(lang_obj.EventID) + " for language prop id = " + str(lang_obj.ID))
            continue

        try:
            lang_obj.lang = Entity.objects.get(id=lang_obj.LanguageID)
        except:
            print("Missing lang obj id = " + str(lang_obj.LanguageID) + " for religion prop id = " + str(lang_obj.ID))
            continue

        lang_info = OfficialLanguage.objects.get_or_create(entity=lang_obj.entity, event=lang_obj.event, language=lang_obj.lang)[0]
        lang_info.percentage = None
        lang_info.save()


def load_official_script():
    pass


load_entities_from_db()
# load_events_from_db()
# load_names_from_db()
# load_official_currency()
# load_official_language()
# load_official_script()
# load_gov()
# load_religious_information()
#load_demographics()

#ent = Entity.objects.get(id=14)
#for gov in Government.get_versions(ent):
#    print(str(gov.entity.id) + " -- " + str(gov.event.date_start) + " -- " + str(gov.event.name) + " -> " + str(gov.type.desc))
#print(Government.get_versions(ent))