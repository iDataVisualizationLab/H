function dataProcessor(data) {
    data.allCounties = _.uniq(_.flatten(data.filter(d => d["County"] !== null).map(d => d["County"])));
    data.allDistrics = _.uniq(_.flatten(data.filter(d => d["District"] !== null).map(d => d["District"])));
    return data;
}

function seperateStr(str) {
    return str.split(/&|\/| and /).map(d => d.trim().toLowerCase());
}

function filterData(filters) {
    dp = basearr;
    d3.nest().key(d => d.type).entries(filters)
        .forEach(ff => {
            dp = dp.filter(e => {
                    var type = ff.values[0].type;
                    if (type === 'ConstYear') {
                        if (ff.values[0].from !== undefined) {
                            var years = Array(ff.values[0].to - ff.values[0].from + 1).fill(0).map((e, i) => i + ff.values[0].from);
                            return years.find(f => e[type] === f.toString())
                        }
                    } else {
                        return ff.values.find(f => e[type] === f.id)
                    }

                }
            )
        });
    dp = new dataProcessor(dp);
    console.log(dp);
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