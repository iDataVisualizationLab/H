function dataProcessor(data) {
    data.allCounties = _.uniq(_.flatten(data.filter(d => d["County"] !== null).map(d => d["County"])));
    data.allDistrics = _.uniq(_.flatten(data.filter(d => d["District"] !== null).map(d => d["District"])));
    data.allHighway = _.uniq(_.flatten(data.filter(d => d["Highway"] !== null).map(d => d["Highway"])));
    // data.allDrainage = _.uniq(_.flatten(data.filter(d => d["District"] !== null).map(d => d["PavementType"])));
    data.allPavementType = _.uniq(_.flatten(data.filter(d => d["PavementType"] !== null).map(d => d["PavementType"])));
    return data;
}

function seperateStr(str) {
    return str.split(/&|\/| and /).map(d => d.trim().toLowerCase());
}

function filterData(filters) {
    let tempDp = basearr;
    d3.nest().key(d => d.type).entries(filters)
        .forEach(ff => {
            tempDp = tempDp.filter(e => {
                    var type = ff.values[0].type;
                    if (type === 'ConstYear') {
                        if (ff.values[0].from !== undefined) {
                            var years = Array(ff.values[0].to - ff.values[0].from + 1).fill(0).map((e, i) => i + ff.values[0].from);
                            return years.find(f => e[type] === f.toString())
                        }
                    } else {
                        return ff.values.find(f => e[type] == f.id)
                    }
                }
            )
        });

    dp = new dataProcessor(tempDp);
}

function reformat(data) {
    Object.keys(data).forEach(k => {
        let d = data[k];
        if (d['Direction'] !== null)
            d['Direction'] = d['Direction'].split(' ')[0].trim().toUpperCase();
        if (d['SlabThickness'] !== null)
            d['SlabThickness'] = Math.round(+d['SlabThickness'].split('"')[0].trim()) || null;
    })
}