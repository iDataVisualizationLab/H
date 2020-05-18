let cutplanes = {};
cutplanes.collectCutData = function(type, pointClouds, horizontalPlane, verticalPlane, profilePosition, profileSize, viewOptions, sortPointCloudsAsIdxs, updatePointCloudPositions) {
    //Collect cutting data.
    //Note that: Since x and y positions are the same for all graph, we hoist below lines out of the loop and take these values for the first one (index zero for custom data)
    let customData = pointClouds[0].geometry.customData;
    let yValues = Array.from(new Set(customData.gridData.y));
    let yIdx = d3.bisectLeft(yValues, customData.yScale.invert(((horizontalPlane.position.y - profilePosition.y) / profileSize.y)));
    let yVal = yValues[yIdx];
    let xValues = Array.from(new Set(customData.gridData.x));
    let xIdx = d3.bisectLeft(xValues, customData.xScale.invert(((verticalPlane.position.x - profilePosition.x) / profileSize.x)));
    let xVal = xValues[xIdx];
    let cutVal = type === 'horizontal' ? xVal : yVal;
    let val = type === 'horizontal' ? yVal : xVal;
    let cutData = {
        traces: [],
        type: type,
        cutValue: cutVal,
    };

    for (let i = 0; i < pointClouds.length; i++) {
        let cutElmData = {};
        customData = pointClouds[i].geometry.customData;
        let xVals = [];
        let yVals = [];
        let zVals = [];
        let values = type === 'horizontal' ? customData.gridData.y : customData.gridData.x;

        values.forEach((v, i) => {
            if (v === val) {
                xVals.push(customData.gridData.x[i]);
                yVals.push(customData.gridData.y[i]);
                zVals.push(customData.gridData.z[i]);
            }
        });
        cutElmData.x = xVals;
        cutElmData.y = yVals;
        cutElmData.z = zVals;
        cutElmData.zScale = customData.zScale;//Store this scale (this is a scale all over the grid, not just this cut point)
        cutElmData.elementName = pointClouds[i].name;
        //TODO: If we take this individually, then each element has a different color scale
        if (viewOptions.colorOption === 1) {
            cutElmData.colorScale = customData.gridData.colorScale;
        }
        cutData.traces.push(cutElmData);

    }
    //In both cases, z value becomes y.
    let chartData = cutData.traces.map((trace, traceIdx) => {
        return {
            //If it is horizontal then the chart data we will put x for the x component, otherwise we put y for the x component
            x: type === 'vertical' ? trace.z.map(z => trace.zScale(z)) : trace.x,
            y: type === 'vertical' ? trace.y : trace.z.map(z => trace.zScale(z)),
            series: trace.elementName,
            type: 'area',
            colorScale: trace.colorScale
        }
    });

    let sortedIdxs;
    let sortedChartData = [];
    if (viewOptions.orderOption === 0) { //Sort at the cut point
        if (type === 'horizontal') {
            //Sort by the xIdx
            let yValuesAtXIdx = chartData.map(d => d.y[xIdx]);
            sortedIdxs = argSort(yValuesAtXIdx);
        } else {
            //Sort by the yIdx
            let xValuesAtYIdx = chartData.map(d => d.x[yIdx]);
            sortedIdxs = argSort(xValuesAtYIdx);
        }
    } else if (viewOptions.orderOption === 1) {// Average horizontal cut
        if (type === 'horizontal') {
            //Sort by the xIdx
            let avgValues = chartData.map(d => d3.mean(d.y));
            sortedIdxs = argSort(avgValues);
        }
    } else if (viewOptions.orderOption === 2) {// Average vertical cut
        if (type === 'vertical') {
            //Sort by the xIdx
            let avgValues = chartData.map(d => d3.mean(d.x));
            sortedIdxs = argSort(avgValues);
        }
    }

    if (sortedIdxs) {//if there is sorted results
        sortedIdxs.reverse();
        for (let i = 0; i < sortedIdxs.length; i++) {
            sortedChartData.push(chartData[sortedIdxs[i]]);
        }
        //TODO: Below two lines help also to sort the plane positions => Should separate these to a different place.
        sortPointCloudsAsIdxs(sortedIdxs);
        updatePointCloudPositions();
        chartData = sortedChartData;
    }


    cutData.traces = chartData;
    return cutData;
}
