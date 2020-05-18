function TwoDCharts() {
    //Exporting
    this.updateChartByIdxs = updateChartByIdxs;
    this.drawChart = drawChart;
    this.drawVerticalSlices = drawVerticalSlices;
    this.drawHorizontalSlices = drawHorizontalSlices;

    //Update charts by sorted indexes
    function updateChartByIdxs(sortedIdxs, verticalChart, horizontalChart) {
        if (sortedIdxs) {
            let sortedVerticalData = [];
            let sortedHorizontalData = [];
            sortedIdxs.forEach(idx => {
                sortedVerticalData.push(verticalChart.data[idx]);
                sortedHorizontalData.push(horizontalChart.data[idx]);
            });
            verticalChart.update(sortedVerticalData);
            horizontalChart.update(sortedHorizontalData);
        }

    }

    function drawVerticalSlices(cutData, verticalChart, horizontalChart, selectedPointClouds, verticalDetailCharts, defaultChartSize, chartPaddings, chartWidth, chartHeight, elementColorScale) {
        let type = cutData.type;
        if (type !== 'vertical') {
            return;
        }

        let cutValue = cutData.cutValue;
        let verticalChartsData = [];

        verticalDetailCharts.forEach((chart, i) => {
            let annotations = {
                'yLine': {
                    valueType: 'value',
                    y: cutValue,
                    color: verticalChart ? verticalChart.settings.annotations.yLine.color : 'gray',
                    strokeWidth: 3
                }
            };

            //
            let chartSettings = {
                noSvg: false,
                showAxes: true,
                width: defaultChartSize + chartPaddings.paddingLeft + chartPaddings.paddingRight,
                height: chartHeight,
                ...chartPaddings,
                colorScale: elementColorScale,
                stepMode: {
                    chartSize: defaultChartSize, // Height for each chart
                    stepHandle: false,
                },
                annotations: annotations,
                orientation: type,
            };

            let chartContentWidth = chartSettings.width - chartSettings.paddingLeft - chartSettings.paddingRight;
            chartSettings.stepMode.stepScale = d3.scaleLinear().domain([0, 1]).range([0, chartSettings.stepMode.chartSize]);

            //Config scales, we need to use one scale for all.
            chartSettings.xScale = d3.scaleLinear().domain([0, 1]).range([0, chartContentWidth]);
            chartSettings.yTickValues = Array.from(new Array(13), (_, i) => 0.5 + i);
            // Hao edit
            // chartSettings.yTickLabels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"].reverse();
            chartSettings.yTickLabels = ["A", "B", "C", "D", "E", "F"].reverse();


            let chartData = [cutData.traces.find(trace => trace.series === selectedPointClouds[i].name)];
            verticalChartsData.push(chartData);

            let container = document.getElementById(`verticalDetailChart${i + 1}`);
            if (!chart) {
                try {
                    verticalDetailCharts[i] = new LineChart(container, chartData, chartSettings);
                    verticalDetailCharts[i].plot();
                } catch (e) {
                    console.log(e);
                }

            } else {
                try {
                    verticalDetailCharts[i].updateAnnotations(annotations);
                    verticalDetailCharts[i].update(verticalChartsData[i]);
                } catch (e) {
                    console.log(e);
                }
            }
        });
    }

    function drawHorizontalSlices(cutData, verticalChart, horizontalChart, selectedPointClouds, horizontalDetailCharts, defaultChartSize, chartPaddings, chartWidth, chartHeight, elementColorScale) {
        let type = cutData.type;

        if (type !== 'horizontal') {
            return;
        }
        let cutValue = cutData.cutValue;
        let horizontalChartsData = [];
        horizontalDetailCharts.forEach((chart, i) => {
            let annotations = {
                'xLine': {
                    valueType: 'value',
                    x: cutValue,
                    color: horizontalChart ? horizontalChart.settings.annotations.xLine.color : 'gray',//Take current color
                    strokeWidth: 3
                }
            };

            //
            let chartSettings = {
                noSvg: false,
                showAxes: true,
                width: chartWidth,
                height: defaultChartSize + chartPaddings.paddingTop + chartPaddings.paddingBottom,
                ...chartPaddings,
                colorScale: elementColorScale,
                stepMode: {
                    chartSize: defaultChartSize, // Height for each chart
                    stepHandle: false,
                },
                annotations: annotations,
                orientation: type,
            };

            let chartContentHeight = chartSettings.height - chartSettings.paddingTop - chartSettings.paddingBottom;
            chartSettings.stepMode.stepScale = d3.scaleLinear().domain([0, 1]).range([0, chartSettings.stepMode.chartSize]);

            chartSettings.yScale = d3.scaleLinear().domain([0, 1]).range([chartContentHeight, 0]);

            // Hao edit
            // chartSettings.xTickValues = Array.from(new Array(10), (_, i) => 0.5 + i);
            // chartSettings.xTickLabels = Array.from(new Array(10), (_, i) => 1 + i);

            chartSettings.xTickValues = Array.from(new Array(9), (_, i) => 0.5 + i);
            chartSettings.xTickLabels = Array.from(new Array(9), (_, i) => 1 + i);

            let chartData = [cutData.traces.find(trace => trace.series === selectedPointClouds[i].name)];
            horizontalChartsData.push(chartData);

            let container = document.getElementById(`horizontalDetailChart${i + 1}`);
            if (!chart) {
                horizontalDetailCharts[i] = new LineChart(container, chartData, chartSettings);
                horizontalDetailCharts[i].plot();
            } else {
                horizontalDetailCharts[i].updateAnnotations(annotations);
                horizontalDetailCharts[i].update(horizontalChartsData[i]);
            }
        });
    }


    function drawChart(cutData, verticalChart, horizontalChart, defaultChartSize, chartPaddings, chartWidth, chartHeight, elementColorScale) {
        try {
            let type = cutData.type;
            let chartData = cutData.traces;
            let cutValue = cutData.cutValue;

            let annotations = type === 'horizontal' ? {
                'xLine': {
                    valueType: 'value',
                    x: cutValue,
                    color: horizontalChart ? horizontalChart.settings.annotations.xLine.color : 'gray',//Take current color
                    strokeWidth: 3
                }
            } : {
                'yLine': {
                    valueType: 'value',
                    y: cutValue,
                    color: verticalChart ? verticalChart.settings.annotations.yLine.color : 'gray',
                    strokeWidth: 3
                }
            };

            let theChart = type === 'horizontal' ? horizontalChart : verticalChart;
            if (!theChart) {
                let chartContainer = document.getElementById(`${type}ChartContainer`);

                let chartSettings = {
                    noSvg: false,
                    showAxes: true,
                    width: chartWidth,
                    height: chartHeight,
                    ...chartPaddings,
                    colorScale: elementColorScale,
                    stepMode: {
                        chartSize: defaultChartSize, // Height for each chart
                        stepHandle: true,
                    },
                    annotations: annotations,
                    orientation: type,
                };
                //Config scales, we need to use one scale for all.
                let chartContentHeight = chartSettings.height - chartSettings.paddingTop - chartSettings.paddingBottom;
                let chartContentWidth = chartSettings.width - chartSettings.paddingLeft - chartSettings.paddingRight;
                chartSettings.stepMode.stepScale = d3.scaleLinear().domain([0, 1]).range([0, chartSettings.stepMode.chartSize]);

                //xScale and yScale here are actually for the z values, only set it depending on the orientation
                if (type === 'vertical') {
                    chartSettings.xScale = d3.scaleLinear().domain([0, 1]).range([0, chartContentWidth]);
                    chartSettings.yTickValues = Array.from(new Array(13), (_, i) => 0.5 + i);
                    chartSettings.yTickLabels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"].reverse();
                    chartSettings.xAxisLabel = {text: "Element distributions"};
                    chartSettings.yAxisLabel = {text: "Horizons"};
                } else {
                    chartSettings.yScale = d3.scaleLinear().domain([0, 1]).range([chartContentHeight, 0]);
                    chartSettings.xTickValues = Array.from(new Array(10), (_, i) => 0.5 + i);
                    chartSettings.xTickLabels = Array.from(new Array(10), (_, i) => 1 + i);
                    chartSettings.xAxisLabel = {text: "Vertical slices"};
                    chartSettings.yAxisLabel = {text: "Element distributions"};
                }


                theChart = new LineChart(chartContainer, chartData, chartSettings);
                theChart.plot();
                // if (type === 'vertical') {
                //     verticalChart = theChart;//Store for next use
                // } else {
                //     horizontalChart = theChart;//Store for next use
                // }

            } else {
                theChart.updateAnnotations(annotations);
                theChart.update(chartData);
            }
            return theChart;//return and store for future use.
        } catch (e) {
            console.log('Error ' + e);
        }
    }
}
