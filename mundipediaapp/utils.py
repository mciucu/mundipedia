def gather_public_state(state, global_constants, context_dict):
    import glob

    world_map_years = set()

    prefix = "mundipediaapp/static/json/world/"
    suffix = ".json"
    for file_name in glob.glob(prefix + "*" + suffix):
        file_name = file_name.replace(prefix, "")
        file_name = file_name.replace(suffix, "")
        try:
            world_map_years.add(int(file_name))
        except:
            pass

    global_constants["WORLD_MAP_YEARS"] = sorted(list(world_map_years))
