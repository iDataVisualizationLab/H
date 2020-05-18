/*Handling data after loading*/
//We define a global object to store and handle data
let contourDataProducer;

function getColumn(data, columnName) {
    if (data.length <= 0 || data[0][columnName] === undefined) {
        return null;
    }
    let column = [];
    d3.map(data, function (d) {
        column.push(d[columnName]);
    });
    return column;
}

function getNumberColumn(data, columnName) {
    if (data.length <= 0 || data[0][columnName] === undefined) {
        return null;
    }
    let column = [];
    d3.map(data, function (d) {
        if (d[columnName].indexOf('<LOD') != -1) {
            column.push(0);
        } else if (!d[columnName]) {
            column.push(null);
        } else {
            column.push(+d[columnName]);
        }
    });
    return column;
}

function validGridId(id) {
    let re = /^[A-Z]\d\d$/g;
    return id != null && id.match(re) != null;
}

function extractGridLetter(gridId) {
    return gridId.substr(0, 1);
}

function extractGridNumber(gridId) {
    return gridId.substr(1, 2);
}

function getGridLetterList(data) {
    let letterList = [];
    d3.map(data, function (d) {
        letterList.push(extractGridLetter(d["Grid ID"]));
    });
    return letterList;
}

function getGridNumberList(data) {
    let numberList = [];
    d3.map(data, function (d) {
        numberList.push(extractGridNumber(d["Grid ID"]));
    });
    return numberList;
}

function getAllElements(data) {
    let headers = d3.keys(data[0]);
    let elements = headers.filter(function (d) {
        return d.indexOf('Concentration') !== -1;
    });
    //Create option 1
    let jsonData = [];
    for (let i = 0; i < elements.length; i++) {
        jsonData.push({value: elements[i], text: elements[i]});
    }
    jsonData.sort((a, b) => {
        return a.text.localeCompare(b.text);
    });
    return jsonData;
}

function smoothenData(contourData, step = 0.05) {
    let t = [];
    let x = [];
    let y = [];
    //Remove outliers
    let q95 = ss.quantile(contourData.z, 0.95);
    let q05 = ss.quantile(contourData.z, 0.05);
    for (let i = 0; i < contourData.z.length; i++) {
        if (contourData.z[i] <= q95 && contourData.z[i] >= q05) {
            t.push(contourData.z[i]);
            x.push(digits.indexOf(contourData.x[i]));
            y.push(letters.indexOf(contourData.y[i]));
        }
    }
    // var model = "exponential";
    let model = "spherical";
    // let model = "gaussian";
    let sigma2 = 0, alpha = 100;
    let variogram = kriging.train(t, x, y, model, sigma2, alpha);
    //Now interpolate data (elementPlaneStepSize) at a point
    contourData.z = [];
    contourData.x = [];
    contourData.y = [];

    for (let i = 0; i < digits.length; i = i + step) {
        for (let j = 0; j < letters.length; j = j + step) {
            contourData.x.push(i);
            contourData.y.push(j);
            contourData.z.push(kriging.predict(i, j, variogram))
        }
    }
}

//Process data for the contours
function setContourX() {
    xContour = getGridNumberList(data);
}

function setContourY() {
    yContour = getGridLetterList(data);
}

function setElmConcentration(index) {
    elmConcentrations[index] = getNumberColumn(data, currentColumnNames[index]);
}

function setContourInformation() {
    allElements = getAllElements(data);
    //Set the two default current elements
    currentColumnNames[0] = allElements[defaultElementIndexes[0]].value;
    currentColumnNames[1] = allElements[defaultElementIndexes[1]].value;
    debugger
    setContourX();
    setContourY();

    setElmConcentration(0);
    setElmConcentration(1);
}

function getContourColorScale(columnName) {
    let colorScale = 'Portland';
    let selectedColorScales = colorScales[colorLevelsScaleIndex];
    if (selectedColorScales[columnName]) {
        colorScale = [];
        let valueScale = d3.scaleLinear().domain(d3.extent(selectedColorScales[columnName].values)).range([0, 1]);
        for (let i = 0; i < selectedColorScales[columnName].values.length - 1; i++) {
            colorScale.push([valueScale(selectedColorScales[columnName].values[i]), selectedColorScales[columnName].colors[i]]);
            colorScale.push([valueScale(selectedColorScales[columnName].values[i + 1]), selectedColorScales[columnName].colors[i]])
        }
    }
    return colorScale;
}

function setContourData(index, smoothen, smoothingStep = 0.1) {
    let columnName = currentColumnNames[index];
    let colorScale = getContourColorScale(columnName);

    if (!contourDataProducer) {
        contourDataProducer = new ContourDataProducer(data);
    }
    let gridData = contourDataProducer.getGridDataByElmName(columnName, smoothen, smoothingStep);
    contourData[index] = [{
        x: gridData.x,
        y: gridData.y,
        z: gridData.z,
        type: plotType,
        name: currentColumnNames[index],
        showscale: true,
        colorscale: colorScale,
        line: {
            smoothing: 0.5,
            color: 'rgba(0, 0, 0,0)'
        },
        colorbar: {
            tickfont: {
                color: 'white'
            },
            ticks: colorScales[columnName]
        },
        connectgaps: true,
    }];
}


//Read data
function readData(fileName, handleData) {
    d3.csv(fileName + "Avg.csv", function (error, rawAvgData) {
        avgData = rawAvgData;
        if (error) throw error;
        d3.csv(fileName + ".csv", function (error, rawData) {
            if (error) throw error;

            data = rawData.filter(function (d) {
                //Valid ID
                return validGridId(d["Grid ID"]);
            });

            //Add data for the three formulas
            let alAW = 26.9815385,
                oAW = 15.999,
                siAW = 28.085,
                feAW = 55.845,
                tiAW = 47.867,
                Al2O3AW = alAW * 2 + oAW * 3,
                alRatio = alAW * 2 / Al2O3AW,
                siO2AW = siAW + 2 * oAW,
                siRatio = siAW / siO2AW,
                Fe2O3AW = feAW * 2 + oAW * 3,
                feRatio = feAW * 2 / Fe2O3AW,
                tiO2AW = tiAW + 2 * oAW,
                tiRatio = tiAW / tiO2AW;
            data = data.map(row => {
                //Use only 20 elements
                let temp = {};
                columns.forEach(c => {
                    temp[c] = row[c];
                });
                row = temp;

                //Calculate Ruxton weathering index
                let si = (row["Si Concentration"] === "<LOD") ? 0 : +row["Si Concentration"],
                    al = (row["Al Concentration"] === "<LOD") ? 0 : +row["Al Concentration"],
                    al2o3 = al / alRatio,
                    sio2 = si / siRatio;
                let RI = sio2 / al2o3;
                row["RI Concentration"] = RI + "";
                //Desilication index
                let fe = (row["Fe Concentration"] === "<LOD") ? 0 : +row["Fe Concentration"],
                    ti = (row["Ti Concentration"] === "<LOD") ? 0 : +row["Ti Concentration"],
                    fe2o3 = fe / feRatio,
                    tio2 = ti / tiRatio;
                let DI = sio2 / (al2o3 + fe2o3 + tio2);
                row["DI Concentration"] = DI + "";
                // Elemental ratio of elements resistant to weathering
                let zr = (row["Zr Concentration"] === "<LOD") ? 0 : +row["Zr Concentration"];
                let SR = ti / zr;
                row["SR Concentration"] = SR + "";
                return row;
            });
            if (handleData) {
                handleData(data);
            }
        });
    });
}

class ContourDataProducer {
    constructor(data) {
        this.data = data;
        this.contourX = getGridNumberList(data);
        this.contourY = getGridLetterList(data);
        this.allElements = getAllElements(data).map(d => d.value.replace(' Concentration', ''));
        this.allGridData = {}
    }

    getGridDataByElmName(elmName, smoothen, smoothingStep = 0.1) {
        let key = elmName + "," + smoothen + "," + smoothingStep;
        if (this.allGridData[key]) {
            return this.allGridData[key];
        }
        let colorScale = getContourColorScale(elmName + " Concentration");
        if (colorScale === "Portland") {
            colorScale = getContourColorScale(this.allElements[0] + " Concentration");//We can't use "Portland" color scheme so we need to use the first one.
        }
        let self = this;
        let gridData = {
            x: self.contourX,
            y: self.contourY,
            z: getNumberColumn(self.data, elmName),
            colorScale: colorScale
        }
        //Smoothen the data in place
        if (smoothen) {
            smoothenData(gridData, smoothingStep);
        }
        //Save for future use.
        this.allGridData[key] = gridData;
        return gridData;
    }

    getGridDataByElmIndex(elmIndex, smoothen, smoothingStep = 0.1) {
        return this.getGridDataByElmName(this.allElements[elmIndex] + ' Concentration', smoothen, smoothingStep);
    }
}