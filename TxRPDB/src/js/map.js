let gm;
let positiveValueDiffScale;
let negativeValueDiffScale;
let heatheatmapmap;

function createColorScale() {
    let thresholds = processThresholds1(colorRanges[analyzeValueIndex][timeStepTypeIndex]);
    let colorScaleControl = createPlotColorScale(thresholds, colorType("negative"), 70, 400);
    colorScaleControl.index = 3;
    gm.map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(colorScaleControl);
}

function updateId(d) {
    return d3.select(this).attr("id", `wellCircle${d.key}`);
}

let radiusScale = d3.scaleLinear().domain([0, 19]).range([5, 2]);
let colorValueScale = d3.scaleLinear().domain([0, 19]).range([1, 0]);

function plotMaps(dp) {
    let longAccessor = (d) => {
        return d[COL_LONG];
    };
    let latAccessor = (d) => {
        return d[COL_LAT];
    };
    //Set the map size.
    d3.select("#map")
        .styles({
            // "width": map_conf.widthG()+"px",
            "width": "100%",
            "height": map_conf.heightG() + "px",
            "margin-right": map_conf.margin.right + "px",
            "margin-top": map_conf.margin.top + "px",
            "padding": 0 + "px"
        });

    gm = new CustomMap("map");

    gm.dispatch.on("draw", draw);

    function draw(event) {
        console.log('draw')
        // plotContours(event);
        // plotWells(event);
    }

    // let radiusScale = d3.scaleLinear().domain([1, 19]).range([5, 2]);
    // let colorValueScale = d3.scaleLinear().domain([1, 19]).range([1, 0]);

    //Plot some extra controls
    //create and set the plot well controls
    // let plotControls = createPlotControls();
    // plotControls.index = 3;
    // gm.map.controls[google.maps.ControlPosition.TOP_LEFT].push(plotControls);
    // createColorScale();
    // let timeLabel = createTimeLabel();
    // timeLabel.index = 3;
    // gm.map.controls[google.maps.ControlPosition.TOP_CENTER].push(timeLabel);
    let arr = [];
    dp.filter(d => d['GPSEnd']).forEach(d => {
        arr.push(d["GPSEnd"]);
        arr.push(d["GPSStart"]);
    });
    gm.fitBounds(arr, longAccessor, latAccessor);


    function addDivPixelFromLatLng(wells, fromLatLngToDivPixel) {
        //let us get the data of one month
        wells = wells.map(well => {
            let p = fromLatLngToDivPixel(well[COL_LAT], well[COL_LONG]);
            well.x = p.x;
            well.y = p.y;
            return well;
        });
        return wells;
    }

    // gm.map.on('click', function (evt) {
    //     console.log(evt.coordinate);
    //     utils.getNearest(evt.coordinate).then(function (coord_street) {
    //         var last_point = points[points.length - 1];
    //         var points_length = points.push(coord_street);
    //
    //         utils.createFeature(coord_street);
    //
    //         if (points_length < 2) {
    //             console.log('Click to add another point');
    //             return;
    //         }
    //
    //         //get the route
    //         var point1 = last_point.join();
    //         var point2 = coord_street.join();
    //
    //         console.log(url_osrm_route + point1 + ';' + point2);
    //
    //         fetch(url_osrm_route + point1 + ';' + point2).then(function (r) {
    //             return r.json();
    //         }).then(function (json) {
    //             if (json.code !== 'Ok') {
    //                 console.log('No route found.');
    //                 return;
    //             }
    //             console.log('Route added');
    //             //points.length = 0;
    //             utils.createRoute(json.routes[0].geometry);
    //         });
    //     });
    // });

}

function Updatemap() {
    let longAccessor = (d) => {
        return d[COL_LONG];
    };
    let latAccessor = (d) => {
        return d[COL_LAT];
    };
    let arr = [];
    dp.filter(d => d['GPSEnd']).forEach(d => {
        arr.push(d["GPSEnd"]);
        arr.push(d["GPSStart"]);
    });
    if (arr.length)
        gm.fitBounds(arr, longAccessor, latAccessor);
}

function colorType(type) {
    return function (d) {
        if (analyzeValueIndex === 0) {
            return color.waterLevel(d.value);
        } else {
            if (type === "negative") {
                return d3.interpolateReds(negativeValueDiffScale(d.value));
            }
            if (type === "positive") {
                return d3.interpolateBlues(positiveValueDiffScale(d.value));
            }
        }
    }
}

function plotGPS() {
    gm.map.pin.remove();

    let ct = dp.filter(d => (d["GPSStart"] !== null) || (d["GPSEnd"] !== null)).map((d) => {
        var bermudaTriangle = d["GPSStart"] || d["GPSEnd"];
        var newf = new ol.Feature({
            geometry: new ol.geom.Point(ol.proj.fromLonLat([bermudaTriangle[COL_LONG], bermudaTriangle[COL_LAT]])),
            data: d
        });
        newf.setStyle(new ol.style.Style({
            image: new ol.style.Icon(/** @type {module:ol/style/Icon~Options} */ ({
                color: (d => colors(sectionProjectMap[d['DataType']]))(d),
                crossOrigin: 'anonymous',
                opacity: 0.8,
                src: 'src/Images/pin.png',
                anchor: [0.5, 1],
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',
                scale: 0.35
            }))
        }));
        return newf;
    });
    var vectorSource = new ol.source.Vector({
        features: ct
    });
    gm.map.pin.layer = new ol.layer.Vector({
        source: vectorSource
    });

    gm.map.pin.addtomap();
}

function plotCounties() {
    //Clear the previous county
    // d3.select('#overlaymap').selectAll('.Countieslayer').remove();
    gm.map.county.remove();
    if (plotCountyOption) {
        let ctPath = {
            type: "GeometryCollection"
        };
        // ctPath.geometries = us.objects.cb_2015_texas_county_20m.geometries;//.filter(d=>d.properties.NAME.toLowerCase()===county.toLowerCase());
        ctPath.geometries = us.objects.cb_2015_texas_county_20m.geometries.filter(d => dp.allCounties.indexOf(d.properties.NAME.toLowerCase()) >= 0);
        if (ctPath.geometries.length) {
            geoJsonObject = topojson.feature(us, ctPath)
            let datam = d3.select('#overlaymap').selectAll('.Countieslayer').data(geoJsonObject);
            datam.enter().append('a').attr('class', 'Countieslayer');
            gm.map.county.setStyle({
                'fill-color': [1, 1, 1, 0.1],
                'stroke-width': 1,
                'stroke-color': [1, 1, 1, 1],
            }, true);
            gm.map.county.addGeoJson(geoJsonObject);
        }
    }
}

function plotDistrict() {
    //Clear the previous county
    gm.map.district.remove();

    if (plotCountyOption) {
        let ctPath = {
            type: "FeatureCollection"
        };
        // ctPath.geometries = us.objects.cb_2015_texas_county_20m.geometries;//.filter(d=>d.properties.NAME.toLowerCase()===county.toLowerCase());
        ctPath.features = us_dis.features.filter(d => dp.allDistrics.find(e => e.toLowerCase() === d.properties.DIST_NM.toLowerCase()));
        if (ctPath.features.length) {
            // geoJsonObject = topojson.feature(us, ctPath)
            // let datam = d3.select('#overlaymap').selectAll('.Countieslayer').data(geoJsonObject);
            // datam.enter().append('a').attr('class', 'Countieslayer');
            gm.map.district.setStyle({
                'fill-color': [1, 1, 1, 0.05],
                'stroke-width': 1,
                'stroke-color': [1, 1, 1, 1],
                'stroke-lineDash': [4, 4],
            }, true);
            gm.map.district.addGeoJson(ctPath);
        }
    }

}

// google
// function plotRoad() {
//
//     if(gm.roadDate===undefined)
//         gm.roadDate = [];
//     // Construct the polygon.
//     gm.roadDate = dp.filter(d=>(d["GPSStart"]!==null)&&(d["GPSEnd"]!==null)).map((d)=>{
//         var bermudaTriangle = new google.maps.Polygon({
//             paths: [d["GPSStart"],d["GPSEnd"]],
//             strokeColor: '#FF0000',
//             strokeOpacity: 0.8,
//             strokeWeight: 3,
//             fillColor: '#FF0000',
//             fillOpacity: 0.35
//         });
//         bermudaTriangle.setMap(gm.map);
//
//         // Add a listener for the click event.
//         bermudaTriangle.addListener('click', ()=>{});
//         return bermudaTriangle;
//     })
// }

// overlayer
function plotRoad() {
    if (gm.roadData === undefined)
        gm.roadData = [];
    // Construct the polygon.
    if (gm.roadData.length) {
        gm.map.removeLayer(gm.map.roadLayer);
    }

    dp.filter(d => d.Route !== undefined).forEach((d) => {
        let polyline = d.Route;

        let route = new ol.format.Polyline({
            factor: 1e5
        }).readGeometry(polyline, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });
        let feature = new ol.Feature({
            type: 'route',
            geometry: route
        });
        feature.setStyle(styles.route);

        gm.roadData.push(feature);
    });

    gm.map.roadLayer = new ol.layer.Vector({
        source: new ol.source.Vector({features: gm.roadData}),
        style: gm.json2style({
            'stroke-color': [255, 0, 0, 0.8],
            'stroke-width': 10,
        })
    });
    gm.map.addLayer(gm.map.roadLayer);

    dp.filter(d => (d["GPSStart"] !== null) && (d["GPSEnd"] !== null) && (d["Route"] === undefined || d["Route"] === null)).forEach((d) => {

        let point1 = d["GPSStart"].lng + "," + d["GPSStart"].lat;
        let point2 = d["GPSEnd"].lng + "," + d["GPSEnd"].lat;


        fetch(url_osrm_route + point1 + ';' + point2).then(function (r) {
            return r.json();
        }).then(function (json) {
            if (json.code !== 'Ok') {
                console.log('No route found.');
                return;
            }
            console.log('Route added');
            console.log(d);
            console.log(json);
            //points.length = 0;
            let polyline = json.routes[0].geometry;

            let route = new ol.format.Polyline({
                factor: 1e5
            }).readGeometry(polyline, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });
            let feature = new ol.Feature({
                type: 'route',
                geometry: route
            });
            feature.setStyle(styles.route);

            gm.roadData.push(feature);
        }).then((polyline) => {
            gm.map.roadLayer = new ol.layer.Vector({
                source: new ol.source.Vector({features: gm.roadData}),
                style: gm.json2style({
                    'stroke-color': [255, 0, 0, 0.8],
                    'stroke-width': 10,
                })
            });
            gm.map.addLayer(gm.map.roadLayer);
        });
    });


}


function processThresholds1(range) {
    let min0 = range[0];//added some value
    let max0 = range[1];
    let step0 = (max0 - min0) / numberOfThresholds[analyzeValueIndex];
    let thresholds0 = [];
    for (let i = 0; i < numberOfThresholds[analyzeValueIndex]; i++) {
        thresholds0.push(min0 + i * step0);//Push it up from zero or above (to avoid zero threshold which is for null value (otherwise null values will be zero and will cover the data)
    }
    return thresholds0;
}

function plotWellsOptionChange() {
    plotWellsOption = document.getElementById("changePlotWells").checked;
    gm.updateMap();
}

function plotCountyOptionChange() {
    plotCountyOption = document.getElementById("changePlotCounty").checked;
    plotCounties();
}

function plotContoursOptionChange() {
    plotContoursOption = document.getElementById("changePlotContours").checked;
    gm.updateMap();
}

function createTimeLabel() {
    let controlDiv = document.createElement('div');
    controlDiv.style.marginLeft = '-10px';
    // Set CSS for the control border.
    var controlUI = document.createElement('div');
    controlUI.style.borderBottomRightRadius = '3px';
    controlUI.style.borderTopRightRadius = '3px';
    controlUI.style.boxShadow = 'rgba(0, 0, 0, 0.3) 0px 1px 4px -1px;';
    controlUI.style.height = '40px';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginTop = '10px';
    controlUI.style.cssFloat = 'left';
    controlUI.style.position = 'relative';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Click to control plot options';
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior.
    var controlText = document.createElement('div');
    // controlText.innerHTML = '';
    controlText.innerHTML = '<div id="timeLabel"></div>';

    controlUI.appendChild(controlText);
    return controlDiv;
}

function createPlotControls() {
    let controlDiv = document.createElement('div');
    controlDiv.style.marginLeft = '-10px';
    // Set CSS for the control border.
    let controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.borderBottomRightRadius = '3px';
    controlUI.style.borderTopRightRadius = '3px';
    controlUI.style.boxShadow = 'rgba(0, 0, 0, 0.3) 0px 1px 4px -1px;';
    controlUI.style.height = '40px';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginTop = '10px';
    controlUI.style.cssFloat = 'left';
    controlUI.style.position = 'relative';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Click to control plot options';
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior.
    let controlText = document.createElement('div');
    // controlText.innerHTML = '';
    controlText.innerHTML = '<div class="dropdown" >\n' +
        '  <div onclick="togglePlotOptions()" class="dropbtn">Plot options</div>\n' +
        '  <div id="myDropdown" class="dropdown-content">\n' +
        '    <div><label for="changePlotContours">Plot contours</label>\n' +
        '    <input type="checkbox" id="changePlotContours" onchange="plotContoursOptionChange()" checked="checked"/></div>\n' +
        '    <div><label for="changePlotWells">Plot wells</label>\n' +
        '    <input type="checkbox" id="changePlotWells" onchange="plotWellsOptionChange()"/></div>\n' +
        '    <div><label for="changePlotCounty">Highlight county</label>\n' +
        '    <input type="checkbox" id="changePlotCounty" onchange="plotCountyOptionChange()"/></div>\n' +
        '  </div>\n' +
        '</div>';

    controlUI.appendChild(controlText);
    return controlDiv;
}

/* When the user clicks on the button,
toggle between hiding and showing the dropdown content */
function togglePlotOptions() {
    document.getElementById("myDropdown").classList.toggle("show");
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function (event) {
    if (!event.target.matches('.dropbtn') && !event.target.matches('.dropdown')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

function createPlotColorScale(ticks, colorFunction, width, height) {
    d3.select("#colorScaleDiv").remove();
    d3.select("#colorScaleSvg").remove();
    ticks = ticks.map(d => Math.round(d));
    positiveValueDiffScale = d3.scaleLinear().domain([0, colorRanges[analyzeValueIndex][timeStepTypeIndex][1]]).range([0.05, 1]);
    negativeValueDiffScale = d3.scaleLinear().domain([0, -colorRanges[analyzeValueIndex][timeStepTypeIndex][0]]).range([0.05, 1]);
    let margin = {left: 10, right: 10, top: 10, bottom: 10};
    let controlDiv = document.createElement('div');
    controlDiv.id = "colorScaleDiv";
    controlDiv.style.width = width + "px";
    controlDiv.style.height = (height + margin.top + margin.bottom) + "px";
    controlDiv.style.backgroundColor = '#fff';
    controlDiv.style.borderRadius = '2px';
    controlDiv.style.boxShadow = 'rgba(0, 0, 0, 0.3) 4px 4px 1px 1px;';
    controlDiv.style.cursor = 'pointer';
    controlDiv.style.marginRight = "10px";

    let y = d3.scaleLinear().domain(d3.extent(ticks)).range([height - margin.top - margin.bottom, 0]);
    // let svg = d3.select(document.createElement('svg'));
    let svg = d3.select("body").append("svg");
    svg.node().style.all = "unset";
    svg.attr("overflow", "visible");
    svg.attr("id", "colorScaleSvg");
    svg.attr("width", width);
    svg.attr("height", (height + margin.top + margin.bottom));
    svg.append("g").attr("transform", `translate(${width / 2}, ${height})`).append("text").text("(feet)")
        .attr("text-anchor", "middle").attr("alignment-baseline", "hanging")
        .attr("font-size", 14);

    let step = y(ticks[0]) - y(ticks[1]);
    ticks.shift();
    let enter = svg.append("g").attr("transform", `translate(0, ${margin.top})`).selectAll("rect").data(ticks.map(d => {
        return {value: d}
    })).enter();
    enter.append("rect")
        .attr("width", 25)
        .attr("height", step)
        .attr("x", 34)
        .attr("y", (d, i) => (y(ticks[i])))
        .attr("fill", d => {
            if (analyzeValueIndex === 0) {
                return color.waterLevel(d.value);
            } else {
                if (d.value < 0) {
                    return d3.interpolateReds(negativeValueDiffScale(-d.value));
                }
                if (d.value >= 0) {
                    return d3.interpolateBlues(positiveValueDiffScale(d.value));
                }
            }
        });
    enter.append("text")
        .attr("x", 30)
        .attr("y", (d, i) => (y(ticks[i]) + step / 2))
        .attr("alignment-baseline", "middle")
        .attr("text-anchor", "end")
        .text((d, i) => ticks[i]);

    controlDiv.appendChild(svg.node());
    return controlDiv;
}

function setTimeLabel(str) {
    str = analyzeValueOptions[analyzeValueIndex] + " in " + str;
    document.getElementById("timeLabel").innerText = str;
}