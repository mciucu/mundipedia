import glob
import json
import re
import os, django
import subprocess
from django.contrib.gis import geos
from django.contrib.gis.geos import GEOSGeometry
from django.core.serializers.json import DjangoJSONEncoder
from django.template.defaultfilters import default

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Mundipedia.settings")
django.setup()

from django.contrib.gis.gdal import DataSource

def insert_geojson(file_name):
    with open(file_name) as data_file:
        data = json.load(data_file)

    print(str(len(data["features"])) + " features found!")
    for feature in data["features"]:
        borders = EntityBorder()
        borders.geom = feature["geometry"]
        print(borders.geom)

def insert_shp(file_name, date_str):
    # try:
    #     event = Event.objects.get(date_start=date_str, type=EventType.objects.get(id=1))
    # except:
    #     event = Event()
    #     event.date_start = date_str
    #     event.type = EventType.objects.get(id=1)
    #     event.name = "Map of " + date_str
    #     event.save()

    event = Event.objects.get_or_create(date_start=date_str, type=EventType.objects.get(id=1), defaults={"name": "Map of the world at " + date_str, "comment": None})[0]

    print("Event ID: " + str(event.id))

    ds = DataSource(file_name)
    layer = ds[0]
    print(layer.fields)
    print(layer.geom_type)

    print(len(layer))

    #return event
    # for feature in layer:
    #     print(str(feature.get("featurecla")))
    # return

    for feature in layer:
        print(feature.get("EntityName")+ " " + str(feature.geom.geos.area) + " " + str(feature.geom.geos.centroid))
        entity_id = int(feature.get("EntityID"))
        try:
            entity = Entity.objects.get(id=entity_id)
        except:
            print("Missing entity " + str(entity_id))
            input("Press Enter to continue...")
            continue

        # if len(names) == 0:
        #     print("No names for entity " + entity.comment + " -- " + feature.get("EntityName") + " id= " + str(entity_id))
        #
        # continue

        try:
            border = Border.objects.get(event=event, entity=entity)
        except:
            border = Border()
            border.event = event
            border.entity = entity

        border.source = Source.objects.get(id=1)
        border.geom = feature.geom.wkt
        border.area = feature.geom.area
        border.perimeter = feature.geom.geos.length
        border.centroid = feature.geom.geos.centroid
        border.labelrank = int(feature.get("ScaleRank"))
        border.comment = feature.get("EntityName")
        border.save()

    return event


class GeoJsonFeature:
    def __init__(self, entity_id, event_id):
        self.type = "Feature"
        self.properties = {}
        self.properties["event_id"] = event_id
        self.properties["entity_id"] = entity_id

class DjangoGEOJSONEncoder(DjangoJSONEncoder):
    """
    DjangoGEOJSONEncoder subclass that knows how to encode GEOSGeometry value
    """

    def default(self, o):
        """ overload the default method to process any GEOSGeometry objects otherwise call original method """
        if isinstance(o, GeoJsonFeature):
            return o.__dict__
        if isinstance(o, GEOSGeometry):
            return json.loads(o.geojson)
        else:
            super(DjangoGEOJSONEncoder, self).default(o)


def extract_geojson(event, file_name):
    result_dict = {}
    features = []
    for border in Border.objects.filter(event=event):
        entity = border.entity
        feature = GeoJsonFeature(border.entity_id, event.id)

        feature.geometry = border.geom
        feature.properties["centroid"] = border.centroid
        feature.properties["labelrank"] = border.labelrank

        names = Name.objects.filter(entity=entity)
        names_en = list(names.filter(lang_code_iso="en"))
        names_official = list(names.exclude(lang_code_iso="en"))
        #names = list(names)

        name_en = first_after(names_en, event.date_start)
        name_own = first_after(names_official, event.date_start)

        name_en = border.comment

        # if not name_en:
        #     name_en = entity.comment
        #     print("No Name in DB for id=" + str(entity.id) + ", defaulting to " + name_en)
        # else:
        #     name_en = name_en.value

        feature.properties["name"] = name_en
        if name_own:
            feature.properties["name_own"] = name_own.value

        currency = OfficialCurrency.get(entity, event.date_start)
        if currency:
            feature.properties["currency"] = currency.get_name()

        gov = Government.get(entity, event.date_start)
        if gov:
            print("Am gasit gov:", gov.type.desc, " pentru ", name_en)
            feature.properties["gov_type"] = gov.type.desc


        features.append(feature)

    result_dict["type"] = "FeatureCollection"
    result_dict["event_id"] = event.id
    result_dict["features"] = features


    with open(file_name, "w") as json_file:
        json.dump(result_dict, json_file, cls=DjangoGEOJSONEncoder)

    print("Found " + str(len(features)) + " features")

def generate_all_maps():
    pass

def simplify_file(file_prefix):
    file_name = file_prefix + ".json"
    small_file_name = file_prefix + "-sm.json"
    print("Simplifying " + file_name + " to " + small_file_name)
    subprocess.call("mapshaper -i " + file_name + " -simplify visvalingam 50% -o force prettify precision=0.01 " + small_file_name, shell=True)

def process_folder(dir):
    print("Processing " + dir)
    shps = glob.glob(dir + "/*.shp")
    if len(shps) == 0:
        print("Did not find any shp filed in " + dir)
        return

    if len(shps) > 1:
        print("Found multiple shp files in directory " + dir + ", skipping")
        return

    file_name = shps[0]

    end_str = re.findall(r"\d+\.shp$", file_name)
    if len(end_str) == 0:
        print("Invalid format " + file_name)
        return

    year = int(end_str[0][:-4])

    event_date = "1 Jan " + str(year)
    event = insert_shp(file_name, event_date)
    file_prefix = "main/static/json/world/" + str(year)
    file_name = file_prefix + ".json"
    small_file_name = file_prefix + "-sm.json"
    extract_geojson(event, file_name)
    simplify_file(file_prefix)


def simplify_all_year_files():
    for year in range(2015, 2020):
        file_prefix = "main/static/json/world/" + str(year)
        file_name = file_prefix + ".json"
        if os.path.isfile(file_name):
            print("Running simplification for " + file_name)
            small_file_name = file_prefix + "-sm.json"
            subprocess.call("mapshaper -i " + file_name + " -simplify 50% -o force prettify precision=0.01 " + small_file_name, shell=True)

def insert_all_in_folder(dir):
    for d in os.listdir(dir):
        subdir = os.path.join(dir, d)
        if not os.path.isdir(subdir):
            continue
        process_folder(subdir)

#insert_geojson("main/static/json/europe_2015.geojson")
#event = insert_shp("/home/mihai/Documents/Maps/VectoriFinali/Europe_2014_source_731/Europe_2014.shp", "1 Jan 2014")
event = Event.objects.get(date_start = "1 Jan 2014", type_id=1)
extract_geojson(event, "main/static/json/world/2014.json")

#insert_all_in_folder("/home/mihai/Documents/Maps/VectoriGata")
#simplify_all_year_files()