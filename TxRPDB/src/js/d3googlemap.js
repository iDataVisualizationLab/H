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

        this.map = new google.maps.Map(d3.select("#" + theDivId).node(), {
            draggableCursor: 'pointer',
            mapTypeId: google.maps.MapTypeId.TERRAIN,
            gestureHandling: 'cooperative'
        });
        //Add the marker style with position as absolute

        this.dispatch = d3.dispatch("draw");
        this.createMarker();
        if(!layerType) layerType = "svg";
        this.layerType = layerType;
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
        let bound = new google.maps.LatLngBounds();
        longLat.forEach(d => {
            let long = d[0];
            let lat = d[1];
            bound.extend(new google.maps.LatLng(lat, long));
        });
        //Fit
        this.map.fitBounds(bound);
    }
    createMarker() {
        let self = this;
        self.overlay = new google.maps.OverlayView();
        //Add the container when the overlay is added to the map
        self.overlay.onAdd = function () {
            let overlayLayer = d3.select(this.getPanes().overlayLayer).append(self.layerType).style("overflow", "visible");
            overlayLayer.append("g").attr("id", "contoursGroup");
            let overlayMouseTarget = d3.select(this.getPanes().overlayMouseTarget).append(self.layerType).style("overflow", "visible");
            overlayMouseTarget.append("g").attr("id", "wellsGroup");

            self.overlay.draw = function () {
                let projection = this.getProjection();
                self.dispatch.call("draw", null, {"overlayLayer": overlayLayer,"overlayMouseTarget": overlayMouseTarget, "transform": transform, "fromLatLngToDivPixel": fromLatLngToDivPixel});
                //Transform function
                function transform(longAccessor, latAccessor){
                    return function transform(d) {
                        d = new google.maps.LatLng(latAccessor(d), longAccessor(d));
                        d = projection.fromLatLngToDivPixel(d);
                        return d3.select(this).attr("transform", `translate(${d.x}, ${d.y})`);
                    }
                }
                function fromLatLngToDivPixel(lat, long){
                    let d = new google.maps.LatLng(lat, long);
                    d = projection.fromLatLngToDivPixel(d);
                    return d;
                }
            };
        };
        //Bind our overlay to the map...
        self.overlay.setMap(this.map);
    }
    updateMap() {
        this.overlay.draw();
    }
}