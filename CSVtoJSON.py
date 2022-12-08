# https://www.youtube.com/watch?v=LeFDBRAhRls&t=223s

import csv
import json

with open("popData.csv", "r") as f:
    reader = csv.reader(f)
    next(reader)
    data = {"popHistory": []}
    for row in reader:
        data["popHistory"].append({
            "year":int(row[0]), 
            "population": int(row[1])
            })

with open ("popData.json", "w") as f:
    json.dump(data, f, indent=4)