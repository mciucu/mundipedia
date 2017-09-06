import subprocess

YEARS = [
    1899,
    1901,
1902, 1903, 1905, 1907, 1908, 1910, 1912, 1913, 1919, 1920, 1921, 1922, 1923, 1924, 1925, 1929, 1932, 1938, 1944, 1945, 1946, 1947, 1948, 1949, 1951, 1953, 1954, 1955, 1956, 1957, 1958, 1960, 1961, 1962, 1963, 1964, 1965, 1966, 1967, 1968, 1970, 1971, 1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980, 1981, 1983, 1984, 1986, 1990, 1991, 1992, 1993, 1994, 1995, 1997, 1999, 2000, 2002, 2005, 2006, 2008, 2011, 2014, 2015]


def simplify_year(year):
    command = "-i %s.json -simplify 0.08 rdp stats -o %s-sm.json precision=0.01" % (year, year)
    print("Command: ", command)
    subprocess.call(["mapshaper"] + command.split(" "), cwd="mundipediaapp/static/json/world")

for year in YEARS:
    simplify_year(year)
