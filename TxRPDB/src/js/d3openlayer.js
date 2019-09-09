function maketooltip(info, properties) {
    if (properties.data&&properties.data.sectionID) {
        let variable_display = ["CCSJ", "ConcreteCAT", "ConstYear", "County", "Direction", "District", "Drainage", "GPSEnd", "GPSStart", "Highway", "HorizontalAlign", "NoOFLanes", "PavementType", "RefMarker", "ShoulderType", "SlabThickness", "Surfacetexture", "VerticalAlign"]
        let ta = d3.select(info).selectAll('.detail_div')
            .data([properties.data],d=>d.sectionID);
        ta.exit().remove();
        let n_ta = ta.enter().append('div').attr('class', 'detail_div');
        n_ta.append('h5').attr('class','section_id');
        n_ta.append('table').append('tbody');
        n_ta.append('div').attr('class','tip_feature');

        let ta_tr = n_ta.merge(ta).select('tbody').selectAll('tr')
            .data(d => variable_display.map(e => [
                {class: 'align-right', val: variable_collection[e].text}, {
                class: 'align-left',
                val: (variable_collection[e].type==='gps' && d[variable_collection[e].id]!==null)?ol.coordinate.toStringHDMS([d[variable_collection[e].id][COL_LONG],d[variable_collection[e].id][COL_LAT]]):d[variable_collection[e].id]
            }]));
        ta_tr.exit().remove();
        let ta_tr_n = ta_tr.enter().append('tr');

        let ta_tr_td = ta_tr_n.merge(ta_tr).selectAll('td')
            .data(d => d);
        ta_tr_td.exit().remove();
        let ta_tr_td_n = ta_tr_td.enter().append('td');
        ta_tr_td_n.append('span');
        ta_tr_td_n
            .merge(ta_tr_td)
            .attr('class', d => d.class)
            .select('span').text(d => d.val);

        ta = n_ta.merge(ta);
        ta.select('.section_id').text(d=>d.sectionID);
        let fdiv = ta.select('.tip_feature').selectAll('.feature_div').data(d=>(project_feature[d.DataType]||project_feature["all"]).map(k=>{return{id:k,val:d.sectionID}}),e=>e.sectionID);
        fdiv.exit().remove();
        let fdiv_n = fdiv.enter().append('div')
            .attr('class','feature_div');
        fdiv_n.append('h6').attr('class','tip_feature_label');
        fdiv_n.append('div').attr('class','tip_feature_content grid-x small-up-2 medium-up-3 large-up-3');

        // fdiv = fdiv_n.merge(fdiv);
        fdiv_n.select('.tip_feature_label').text(d=>project_feature_collection[d.id].text);
        fdiv_n.select('.tip_feature_content').each(function(d){project_feature_collection[d.id].show(d.val,d3.select(this))});

    }
}

function printDislog(data){
    let datafromtip = d3.selectAll('.tip_feature_content div.cell').data();
    let nestlist = d3.nest().key(d=>d.type).entries(datafromtip);
    let prinflist = d3.select(printModal).select('.printModal_content').selectAll('.print_feature_content')
        .data(nestlist,d=>''+d.key+d.values.map(e=>e.url).join(','));

    prinflist.exit().remove();

    let prinflist_n =  prinflist.enter().append('div')
        .attr('class','print_feature_content grid-y');

    prinflist_n.append('h6').attr('class','print_feature_label');
    prinflist_n.append('ul').attr('class','print_feature_list');

    prinflist =  prinflist.merge(prinflist_n);
    prinflist.select('.print_feature_label').text(d=>project_feature_collection[d.key].text);

    let item = prinflist.select('.print_feature_list').selectAll('.print_feature_list_item').data(d=>d.values,d=>d.filename);
    item.exit().remove();
    let item_n = item.enter().append('li').attr('class','print_feature_list_item grid-x');

    item_n.append('span').attr('class','filename cell medium-8');
    let menu_list = item_n.append('div').attr('class','print_menu_list cell medium-4 menu align-right   ');
    menu_list.append('a').attr('class','print_menu_list_download')
        .attr('target',"_blank")
        .attr('href',d=>d.urlDownload).attr('download',d=>d.filename).append('i').attr('class','fas fa-download');
    menu_list.append('button').attr('class','print_menu_list_print').append('i').attr('class','fas fa-print');

    item = item_n.merge(item);
    item.select('.filename').text(d=>d.filename);
    item.select('.print_menu_list_download').on('click',d=>
        downloadfile(d.urlDownload,d.filename));
    item.select('.print_menu_list_print').on('click',d=>printfile(d.urlDownload));
}
function downloadfile(url,filename){
    if (filename.split('.').pop()==='pdf'){
        openPdfInNewTab(url,undefined,'Document',filename)
    }
}
function openPdfInNewTab(url,
                         postData,
                         description = 'Document',
                         filename = description + '.pdf') {
    // if (!window.navigator.msSaveOrOpenBlob) {
    //     var tabWindow = window.open('', '_blank');
    //     var a = tabWindow.document.createElement('a');
    //     a.textContent = 'Loading ' + description + '..';
    //     tabWindow.document.body.appendChild(a);
    //     tabWindow.document.body.style.cursor = 'wait';
    // }

    $.ajax({
        type: 'POST',
        url: 'https://cors-anywhere.herokuapp.com/'+url,
        dataType: 'arraybuffer',
        crossDomain: true,
        success:function(response) {
            var file = new Blob([response], {type: 'application/pdf'});

                window.document.body.style.cursor = 'auto';
                var url = a.href = window.URL.createObjectURL(file);
                a.click();
                a.download = filename;

            setTimeout(function revokeUrl() {
                window.URL.revokeObjectURL(url);
            }, 3600000);
        }});
}
function printfile (url){
    $.ajax({
        type: 'GET',
        url: 'https://cors-anywhere.herokuapp.com/'+url,
        crossDomain: true,
        success:function(response) {
            var iframe = document.createElement('iframe');
            document.body.appendChild(iframe);
                iframedoc = iframe.contentDocument || iframe.contentWindow.document;

            iframedoc.body.innerHTML = response;
            iframe.contentWindow.print();
        }});
}
/**
 * To use this please add Google Maps API and D3
 * For instance:
 * <script src="//maps.google.com/maps/api/js?key=AIzaSyAA-YOLIVTWEZLS7316nJfEX3C9FedRkLg"></script>
 * <script src="//d3js.org/d3.v3.min.js"></script>
 * Need to implement the "draw" event which returns:
 * {"layer": layer, "transform": transform}
 * The layer is the div (that is overlay on the map)
 * The g element for the marker should have a class named .marker and position style is absolute
 * .marker {position: absolute;}
 */

class GoogleMap {
    /**
     * Create a new map and place it to the div id
     * @param theDivId
     */

    constructor(theDivId, layerType) {
        let self = this;
        self.view = new ol.View({
            center: [0, 0],
            zoom: 1
        });
        self.map = new ol.Map({
            target: theDivId,
            layers: [
                new ol.layer.Tile({
                    preload: 4,
                    source: new ol.source.OSM()
                }),
                // new ol.layer.Tile({
                //     source: new ol.source.Stamen({
                //         layer: 'terrain-labels'
                //     })
                // })
            ],
            view: self.view
        });
        self.map.addControl(new ol.control.ScaleLine({units: 'us'}));
        self.vectorSource = new ol.layer.Vector({});
        // self.draw = new ol.interaction.Draw({
        //     source: self.vectorSource,
        //     type: 'LineString'
        // });
        //Add the marker style with position as absolute
        // self.map.addInteraction(self.draw);

        self.dispatch = d3.dispatch("draw");

        if(!layerType) layerType = "svg";
        self.layerType = layerType;


        self.createMarker();
        self.map.on('pointermove', showInfo);
        self.map.on('singleclick', showInfo);
        self.map.on('click', clickmapcheck);

        function showInfo(event) {
            if (!self.holdTip) {
                var info = self.tooltip.getElement();
                var features = self.map.getFeaturesAtPixel(event.pixel);
                var coordinate = event.coordinate;
                // var hdms = ol.coordinate.toStringHDMS(ol.proj.toLonLat(coordinate));
                if (!features || !features[0].getProperties().data) {

                    info.classList.add("hide");
                    return;
                }
                self.tooltip.setPosition(coordinate)
                // d3.select(info).styles({
                //     top: coordinate[0]+'px',
                //     right: coordinate[1]+'px'
                // });
                var properties = features[0].getProperties();

                d3.select(info).select('.close_tooltip')
                    .on('click',()=>{self.holdTip = false;info.classList.add("hide");});

                d3.select(info).select('.print-button')
                    .on('click',()=>{printDislog(properties.data);$('#printModal').foundation('open');});
                maketooltip(info, properties);
                info.classList.remove("hide");
            }
        }

        function clickmapcheck() {
            if(!d3.select(info).classed('hide')) {
                self.holdTip = true;
            }
        }

    }
    makelayermanage(name){
        let self = this;
        self.map[name]=[];
        self.map[name].remove = ()=>{
            this.length = 0;
            if (self.map[name].layer) {
                self.map.removeLayer(self.map[name].layer);
                self.map[name].layer = undefined
            }
        };
        self.map[name].styles = {
            'Polygon':new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                })})};
        self.map[name].styleFunction = function(feature) {
            return this.styles[feature.getGeometry().getType()];
        };
        self.map[name].setStyle = function(newstyle,single){
            if (single){
                this.styles = self.json2style(newstyle);
                this.styleFunction = this.styles;
            }else{
                for (let i in newstyle)
                    this.styles[i] = self.json2style(newstyle[i]);
                this.styleFunction = function(feature) {
                    return this.styles[feature.getGeometry().getType()];
                }
            }
        }
        self.map[name].addGeoJson = function (geoJsonObject){
            var vectorSource = new ol.source.Vector({
                features: new ol.format.GeoJSON().readFeatures(geoJsonObject,{featureProjection: 'EPSG:3857'})
            });
            let  vectorLayer = new ol.layer.Vector({
                source: vectorSource,
                style: this.styleFunction
            });
            this.layer = vectorLayer;
            self.map.addLayer(this.layer);
        };
        self.map[name].addtomap = function (){
            self.map.addLayer(this.layer);
        };
    }
    jsUcfirst(string)
    {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    json2style(styleObject){
        let temp_style = {};
        Object.keys(styleObject).forEach(k=>{
            const key_arrr=  k.split('-');
            if (!temp_style[key_arrr[0]])
                temp_style[key_arrr[0]] = {};
            temp_style[key_arrr[0]][key_arrr[1]]=styleObject[k];

        });
        let temp_op ={};
        Object.keys(temp_style).forEach(k=>{
            temp_op[k] = new ol.style[this.jsUcfirst(k)](temp_style[k]);
        });
        return new ol.style.Style(temp_op);
    }
    /**
     * Fit the map with the list of long and lat inform of array of points.
     * @param longLat
     * @param longAccessor
     * @param latAccessor
     */
    fitBounds(longLat0, longAccessor, latAccessor) {
        let longLat = longLat0.slice();
        if (longAccessor && latAccessor) {
            longLat = longLat.map(d => [longAccessor(d), latAccessor(d)]);
        }
        longLat.forEach((d,i) => {
            let long = d[0];
            let lat = d[1];
            longLat[i] = ol.proj.transform([parseFloat(long), parseFloat(lat)], 'EPSG:4326', 'EPSG:3857');
        });
        //Fit

        var feature = new ol.Feature({
            geometry: new ol.geom.Polygon([longLat])
        })
        var polygon = (feature.getGeometry());
        this.view.fit(polygon);
    }
    latlong2ol(arr){
        return arr.map(d=>ol.proj.transform([parseFloat(d.lng), parseFloat(d.lat)], 'EPSG:4326', 'EPSG:3857'))
    }
    createMarker() {
        let self = this;
        self.tooltip = new ol.Overlay({
            element: document.getElementById('info'),
        });
        self.map.addOverlay(self.tooltip);

        self.makelayermanage('county');
        self.makelayermanage('district');
        self.makelayermanage('pin');
        //Add the container when the overlay is added to the map
        // self.overlay.onAdd = function () {
        //     this.map.addOverlay()
        //     let overlayLayer = d3.select(this.getPanes().overlayLayer).append(self.layerType).style("overflow", "visible");
        //     overlayLayer.append("g").attr("id", "contoursGroup");
        //     let overlayMouseTarget = d3.select(this.getPanes().overlayMouseTarget).append(self.layerType).style("overflow", "visible");
        //     overlayMouseTarget.append("g").attr("id", "wellsGroup");
        //
        //     self.overlay.draw = function () {
        //         let projection = this.getProjection();
        //         self.dispatch.call("draw", null, {"overlayLayer": overlayLayer,"overlayMouseTarget": overlayMouseTarget, "transform": transform, "fromLatLngToDivPixel": fromLatLngToDivPixel});
        //         //Transform function
        //         function transform(longAccessor, latAccessor){
        //             return function transform(d) {
        //                 d = new google.maps.LatLng(latAccessor(d), longAccessor(d));
        //                 d = projection.fromLatLngToDivPixel(d);
        //                 return d3.select(this).attr("transform", `translate(${d.x}, ${d.y})`);
        //             }
        //         }
        //         function fromLatLngToDivPixel(lat, long){
        //             let d = new google.maps.LatLng(lat, long);
        //             d = projection.fromLatLngToDivPixel(d);
        //             return d;
        //         }
        //     };
        // };
        // //Bind our overlay to the map...
        // self.overlay.setMap(this.map);
    }
    updateMap() {
        this.overlay.draw();
    }
}