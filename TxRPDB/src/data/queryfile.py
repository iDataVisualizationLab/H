from os import listdir
from os.path import isfile, join
import json
mypath = '..\data\SurveyData'
with open('..\data\Data_details.json','r', encoding='utf-8-sig', errors='ignore') as f:
    data = json.load(f)
    list={}
for d in data:
    newpath = mypath+'\\'+d
    try:
        infol = {}
        infodir = listdir(newpath)
        for dirIn in listdir(newpath):
            try:
                infol[dirIn] = [f for f in listdir(newpath+'\\'+dirIn) if isfile(join(newpath+'\\'+dirIn, f))]
            except:
                pass
        if (len(listdir(newpath))):
            list[d] = infol
    except:
        pass
print(json.dumps(list))
with open('listMedia.json', 'w') as outfile:
    json.dump(list, outfile)
