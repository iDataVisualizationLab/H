$(document).ready(function () {

    init();
});

function initmap() {
    map_conf.height = map.clientHeight
}

function initFilterSetting() {
    let schema_field = d3.select("#schemaSetting").selectAll('div').data(specificVariables)
        .enter()
        .append('div')
        .attr('class', 'schema-field')
        .attr('id', d => d.id);
    schema_field.append('span').attr('class', 'schema-field-label').text(d => {
        return varNameProcessor(d.text);
    });
    schema_field.append('select').attr('class', 'schema-field-tag').attr('multiple', '').attr('placeholder', d => `Choose ${d.text} ....`);
    schema_field.append('div').attr('class', 'schema-field-chart')
        .append('svg').each(function (d) {
        d.schemabox = Schemabox().graphicopt(schemaSvg_option).svg(d3.select(this)).init().visibility(d.statistic).filterChangeFunc(filterTrigger).master(d);
    });
}

function init() {
    initmap();
    initFilterSetting();
    sectionToProject();

    d3.select('#projects').selectAll('projects_item').data(Object.keys(project_collection).map(k => project_collection[k]))
        .enter().append('li').attr('class', 'button projects_item').classed('has-submenu', d => d.sub.length).each(function (d, i) {
            const currentel = d3.select(this);
            currentel.text(d.text);
            if (d.sub.length) {
                let ul_item = currentel.append('ul').attr('class', 'submenu menu vertical').attr('data-submenu', '');
                ul_item.selectAll('li').data(e => e.sub)
                    .enter().append('li').text(e => e).on('click', e => {
                    return addFilter({type: 'DataType', text: e, id: e}, true)
                });
            } else {
                currentel.on('click', e => {
                    return addFilter({type: 'DataType', text: e.text, id: e.id}, true)
                });
            }
            currentel.style("background-color", colors(d['text']));

        }
    );

    d3.select('#filterContent').on('removeFilter', function (d) {
        removeFilter(d3.event.detail, false);
    });

    Foundation.reInit($('#projects'));
    readConf("Data_details").then((data) => {
        reformat(data);
        basedata = data;
        basearr = d3.values(data);
        basearr.forEach(d => {
            if (d['GPSEnd'] !== null)
                d['GPSEnd'] = dmstoLongLat(d['GPSEnd']);
            if (d['GPSStart'] !== null)
                d['GPSStart'] = dmstoLongLat(d['GPSStart']);
            if (d['County'] !== null)
                d['County'] = seperateStr(d['County'])
        });

        dp = new dataProcessor(basearr);
    }).then(function () {
        return readConf("listMedia").then((data) => {
            mediaQuery = data
        });
    }).then(function () {
        return readConf("district_counties").then((data) => {
            district_counties = data;
            // dp.allDistrics = district_counties.map(d => d.district).flat();
            // dp.allCounties = district_counties.map(d => d.counties.map(e => e.name.trim())).flat();
        });
    }).then(function () {
            return readLib("TxDOT_Districts", 'json').then((data) =>
                us_dis = data, us_dis);
        }
    ).then(function () {
            return readLib("TX-48-texas-counties", 'json').then((data) => us = data, us);
        }
    ).then(function () {
        let max_d = 0;

        specificVariables.forEach(v => {

            let data = d3.nest().key(d => d[v.id]).sortKeys((a, b) => a - b)
                .rollup(d => {
                    return {len: d.length, val: d[0][v.id], elem: countElements(d)}
                })
                .entries(dp.filter(d => d[v.id] !== null));

            if (v.id === 'DataType') {
                data = sortProject(data);
            }

            v.schemabox.dataShadow(data);
            max_d = Math.max(max_d, d3.max(data, d => d.value.len));
        });

        specificVariables.forEach(v => {
            let data = v.schemabox.dataShadow();
            data.range = [0, max_d];

            var hasSlider = false;

            if (v.id === 'ConstYear') {
                hasSlider = true;
            }
            v.schemabox.dataShadow(data).draw_Shadow(hasSlider);

            selectize_init(d3.selectAll('.schema-field').filter(d => d.text === v.text).select('.schema-field-tag'), data);

        });

        plotMaps(dp);
        redrawMap();
    });
}

function selectize_init(selection, data, type) {
    selection.selectAll('option')
        .data(data)
        .enter().append('option')
        .text(d => {
            return d.key;
        });

    var eventHandler = function (name) {
        return function () {
            // console.log(name,arguments);
        };

    };

    $(selection.node()).selectize({
        plugins: ['remove_button'],
        onChange: eventHandler('onChange'),
        onItemAdd: onItemAdd(),
        onItemRemove: onItemRemove(),
        onOptionAdd: eventHandler('onOptionAdd'),
        onOptionRemove: eventHandler('onOptionRemove'),
        onDropdownOpen: eventHandler('onDropdownOpen'),
        onDropdownClose: eventHandler('onDropdownClose'),
        onFocus: eventHandler('onFocus'),
        onBlur: eventHandler('onBlur'),
        onInitialize: eventHandler('onInitialize'),
    })

}

function onItemAdd() {
    return function () {
        console.log(arguments);
        var newSelected = arguments[0];
        var type = arguments[1][0].parentNode.parentNode.parentNode.id;
        addFilter({type: type, text: newSelected, id: newSelected}, false);
    };
}

function onItemRemove() {
    return function () {
        var newSelected = arguments[0];
        var type = this.$wrapper[0].parentNode;
        removeFilter({type: type, text: newSelected, id: newSelected}, true);

    };
}

function redrawMap() {
    d3.select('#numberSection').text(dp.length);
    plotCounties();
    plotDistrict();
    plotRoad();
    plotGPS();
    UpdateSchema();
}

function UpdateSchema() {
    specificVariables.forEach(v => {
        let data = d3.nest().key(d => {
            return d[v.id];
        })
            .rollup(d => {
                return {len: d.length, val: d[0][v.id], elem: countElements(d)}
            })
            .entries(dp.filter(d => d[v.id] !== null));

        var groupCountData = data.map(d => d.value.elem);
        var stackData = d3.stack().keys(project_name)(groupCountData);
        stackData.forEach(col => col.forEach(d => d['project'] = col.key))
        stackData = stackData[0].map((col, i) => stackData.map(row => row[i]));

        data.forEach(function (d, i) {
            d.value['stack'] = stackData[i];
        });

        v.schemabox.data(data);
    });
}

function addFilter(d, collapseMode) {
    if (collapseMode) {
        _.remove(filters, e => e.type === d.type);
    }
    console.log("add ", d);

    filters.push(d);
    updateFilterChip(d3.select('#filterContent'), filters);
    filterData(filters);
    Updatemap();
    redrawMap();

    updateFields(d.type);
}

function updateFields(type, action) {
    if (filters.length === 0) {
        updateOptions("District", dp.allDistrics);
        updateOptions("County", dp.allCounties);
        updateOptions("Highway", dp.allHighway);
        updateOptions("PavementType", dp.allPavementType);

        return;
    }

    switch (type) {
        case "District":
            updateOptions("County", dp.allCounties);
            updateOptions("Highway", dp.allHighway);
            updateOptions("PavementType", dp.allPavementType);
            if (action === "remove") {

            }
            break;
        case "County":
            updateOptions("District", dp.allDistrics);
            updateOptions("Highway", dp.allHighway);
            updateOptions("PavementType", dp.allPavementType);
            break;
        case "Highway":
            updateOptions("District", dp.allDistrics);
            updateOptions("County", dp.allCounties);
            updateOptions("PavementType", dp.allPavementType);
            break;
        case "PavementType":
            updateOptions("District", dp.allDistrics);
            updateOptions("County", dp.allCounties);
            updateOptions("Highway", dp.allHighway);
            break;
        default:
            break;
    }
}

function updateOptions(typeField, dpData) {


    console.log("update: ", typeField);
    let selectizeCounty = $(d3.select(`#${typeField}`).select('.schema-field-tag').node())[0].selectize;

    selectizeCounty.clearOptions();

    let data = dpData.map(function (d, i) {
        return {'text': d, 'value': d}
    });

    console.log(data);

    selectizeCounty.addOption(data);

    selectizeCounty.refreshOptions(false);
}

function removeFilter(d, fromSchema) {
    if (!fromSchema) {
        $("#" + d.type + " .selectized")[0].selectize.removeItem(d.text);
    }


    _.remove(filters, e => e.id === d.id);
    updateFilterChip(d3.select('#filterContent'), filters);
    filterData(filters);
    Updatemap();
    redrawMap();

    console.log("remove", $(d.type).attr("id"));

    updateFields($(d.type).attr('id'));
}

function filterTrigger(ob, state) {
    if (state)
        addFilter(ob);
    else
        removeFilter(ob, false);
}

function updateYearRangeFilter(d, collapseMode) {
    if (yearRangeFilter.min === d.from && yearRangeFilter.max === d.to) {
        _.remove(filters, e => e.type === d.type && e.from === yearRangeFilter.from && e.to === yearRangeFilter.to);
        removeFilter(d, true);
        return;
    }

    if ((yearRangeFilter.from !== d.from) || (yearRangeFilter.to !== d.to)) {
        _.remove(filters, e => e.type === d.type && e.from === yearRangeFilter.from && e.to === yearRangeFilter.to);
        yearRangeFilter.from = d.from;
        yearRangeFilter.to = d.to;
        addFilter(d, collapseMode);
    }
}