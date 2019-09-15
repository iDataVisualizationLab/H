$(document).ready(function(){

    init();
});
function initmap(){
    map_conf.height = map.clientHeight
}
function initFilterSetting(){
    let schema_field = d3.select("#schemaSetting").selectAll('div').data(arr_variable_collection)
        .enter()
        .append('div')
        .attr('class','schema-field');
    schema_field.append('span').attr('class','schema-field-label').text(d=>{return varNameProcessor(d.text);});
    schema_field.append('select').attr('class','schema-field-tag').attr('multiple','').attr('placeholder',d=>`Choose ${d.text} ....`);
    schema_field.append('div').attr('class','schema-field-chart')
        .append('svg').each(function(d){
        d.schemabox = Schemabox().graphicopt(schemaSvg_option).svg(d3.select(this)).init().visibility(d.statistic).filterChangeFunc(filterTrigger).master(d);
    });
    // schema_field.select(".selectize-control").attr("visibility", function (d) {
    //     if (d.statistic) {return "hide"} else return "unset";
    // })
}
function init(){
    // sortVariables();
    initmap();
    initFilterSetting();
    sectionToProject();

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    d3.select('#projects').selectAll('projects_item').data(Object.keys(project_collection).map(k=>project_collection[k]))
        .enter().append('li').attr('class','button projects_item').classed('has-submenu',d=>d.sub.length).each(function(d, i){
        const currentel = d3.select(this);
        currentel.text(d.text);
            if(d.sub.length) {
                let ul_item = currentel.append('ul').attr('class','submenu menu vertical').attr('data-submenu','');
                ul_item.selectAll('li').data(e=>e.sub)
                    .enter().append('li').text(e=>e).on('click',e=>addFilter({type:'DataType',text:e,id:e},true));
            } else{
                currentel.on('click',e=>addFilter({type:'DataType',text:e.text,id:e.id},true));
            }
            currentel.style("background-color", colors(d['text']));

        }
    );

    d3.select('#filterContent').on('removeFilter',function(d){
        removeFilter(d3.event.detail);
    })
    Foundation.reInit($('#projects'));
    readConf("Data_details").then((data)=>{
        reformat(data);
        basedata = data;
        basearr = d3.values(data) ;
        basearr.forEach(d=>{
            if (d['GPSEnd'] !== null)
                d['GPSEnd'] = dmstoLongLat(d['GPSEnd']);
            if (d['GPSStart'] !== null)
                d['GPSStart'] = dmstoLongLat(d['GPSStart']);
            if (d['County'] !== null)
                d['County'] = seperateStr(d['County'])
        });

        dp = new dataProcessor(basearr);
    }).then(function(){
        return readConf("listMedia").then((data)=>{mediaQuery=data});
    }).then(function(){
            return readLib("TxDOT_Districts",'json').then((data)=>
                us_dis=data,us_dis);
        }
    ).then (function(){
            return readLib("TX-48-texas-counties",'json').then((data)=>us=data,us);
        }
    ).then(function() {
        let max_d = 0;
        arr_variable_collection.forEach(v=>{

            let data = d3.nest().key(d=>d[v.id]).sortKeys((a,b)=>a-b)
                    .rollup(d=>{return {len: d.length,val: d[0][v.id], elem: countElements(d)}})
                    .entries(dp.filter(d=>d[v.id]!==null));

            if (v.id === 'DataType') {
                data = sortProject(data);
            }

            v.schemabox.dataShadow(data);
            max_d = Math.max(max_d,d3.max(data,d=>d.value.len));
        });

        arr_variable_collection.forEach(v=> {
            let data = v.schemabox.dataShadow();
            data.range=[0, max_d];
            v.schemabox.dataShadow(data).draw_Shadow();

            selectize_init(d3.selectAll('.schema-field').filter(d=>d.text===v.text).select('.schema-field-tag'),data)
        });
        plotMaps(dp);
        redrawMap();
    });
}

function selectize_init(selection,data){
    selection.selectAll('option').data(data)
        .enter().append('option')
        .text(d=>d.key);
    $(selection.node()).selectize({plugins: ['remove_button']
    })
}

function redrawMap(){
    d3.select('#numberSection').text(dp.length);
    plotCounties();
    plotDistrict();
    plotRoad();
    plotGPS();
    UpdateSchema();
}

function UpdateSchema(){
    arr_variable_collection.forEach(v=>{
        let data = d3.nest().key(d=>{return d[v.id];})
            .rollup(d=>{return {len: d.length,val: d[0][v.id], elem: countElements(d)}})
            .entries(dp.filter(d=>d[v.id]!==null));

        var groupCountData = data.map(d => d.value.elem);
        var stackData = d3.stack().keys(project_name)(groupCountData);
        stackData.forEach(col => col.forEach(d => d['project'] = col.key))
        stackData = stackData[0].map((col,i) => stackData.map(row => row[i]));

        data.forEach(function (d, i) {
            d.value['stack'] = stackData[i];
        });

        v.schemabox.data(data);
    });
}
function addFilter(d,collapseMode){
    if(collapseMode){
        _.remove(filters, e=>e.type===d.type);
    }
    filters.push(d);
    updateFilterChip(d3.select('#filterContent'),filters);
    filterData(filters);
    Updatemap();
    redrawMap();
}
function removeFilter(d){
    _.remove(filters, e=>e.id===d.id);
    updateFilterChip(d3.select('#filterContent'),filters);
    filterData(filters);
    Updatemap();
    redrawMap();
}
function filterTrigger (ob,state) {
    if(state)
        addFilter(ob);
    else
        removeFilter(ob);
}
function updateFilterschema(){

}