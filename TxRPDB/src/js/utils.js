let points = [],
    msg_el = document.getElementById('msg'),
    url_osrm_nearest = '//router.project-osrm.org/nearest/v1/driving/',
    url_osrm_route = '//router.project-osrm.org/route/v1/driving/',
    icon_url = '//cdn.rawgit.com/openlayers/ol3/master/examples/data/icon.png',
    vectorSource = new ol.source.Vector(),
    vectorLayer = new ol.layer.Vector({
        source: vectorSource
    }),
    styles = {
        route: new ol.style.Style({
            stroke: new ol.style.Stroke({
                width: 6, color: [40, 40, 40, 0.8]
            })
        }),
        icon: new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 1],
                src: icon_url
            })
        })
    };

let utils = {
    getNearest: function(coord){
        let coord4326 = utils.to4326(coord);
        return new Promise(function(resolve, reject) {
            //make sure the coord is on street
            fetch(url_osrm_nearest + coord4326.join()).then(function(response) {
                // Convert to JSON
                console.log(response);
                return response.json();
            }).then(function(json) {
                if (json.code === 'Ok') resolve(json.waypoints[0].location);
                else reject();
            });
        });
    },
    createFeature: function(coord) {
        let feature = new ol.Feature({
            type: 'place',
            geometry: new ol.geom.Point(ol.proj.fromLonLat(coord))
        });
        feature.setStyle(styles.icon);
        vectorSource.addFeature(feature);

        // gm.map.pin.layer = vectorLayer;
        //
        // gm.map.pin.addtomap();
    },
    createRoute: function(polyline) {
        console.log(polyline);
        // route is ol.geom.LineString
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
        vectorSource.addFeature(feature);
    },
    to4326: function(coord) {
        return ol.proj.transform([
            parseFloat(coord[0]), parseFloat(coord[1])
        ], 'EPSG:3857', 'EPSG:4326');
    }
};