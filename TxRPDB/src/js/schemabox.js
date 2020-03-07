let Schemabox = function () {
    let graphicopt = {
            margin: {top: 20, right: 0, bottom: 0, left: 0},
            width: 420,
            height: 250,
            scalezoom: 10,
            barcolor: 'red',
            barWidth: 14,
            fontSize: 12,
            widthView: function () {
                return this.width * this.scalezoom
            },
            heightView: function () {
                return this.height * this.scalezoom
            },
            widthG: function () {
                return this.widthView() - this.margin.left - this.margin.right
            },
            heightG: function () {
                return this.heightView() - this.margin.top - this.margin.bottom
            },
            svgHeightGToHeight: function (newHeightG) {
                this.height = newHeightG + this.margin.top + this.margin.bottom;
                return this.height;
            }
        },
        svg, g, visibility, filterChangeFunc = function () {
        }, master = {}, dataShadow = [], g_shadow, maing, overlayg,
        data = [];
    let schemabox = {};

    var x = d3.scaleLinear()
        .range([0, graphicopt.widthG()]);
    var y = d3.scaleBand()
        .range([0, graphicopt.heightG()])
        .padding(0.2);

    schemabox.draw_Shadow = function (hasSlider) {
        var numOfItems = dataShadow.map(d => d.key).length;

        // x.domain(dataShadow.range);

        var maxValue = Math.ceil(Math.max(...dataShadow.map(d => d.value.len)) / 10) * 10;

        x.domain([0, maxValue]);

        if (hasSlider) graphicopt.barWidth = graphicopt.barWidth / 2;

        y.range([0, numOfItems * graphicopt.barWidth])
            .domain(dataShadow.map(d => {
                return d.key;
            }));

        svg.attr("height", graphicopt.svgHeightGToHeight(numOfItems * graphicopt.barWidth));

        var xAxis = d3.axisBottom(x).tickSize([]).ticks(5);

        var yAxis = d3.axisLeft(y).tickSize([]).tickPadding(5);

        var yAxisSelected = g.select(".y.axis")
            .call(yAxis);
        g.select(".x.axis")
            .attr("transform", `translate(1,${numOfItems * graphicopt.barWidth})`)
            .call(xAxis);

        g.select(".grid")
            .attr("transform", `translate(1,${numOfItems * graphicopt.barWidth})`)
            .call(xAxis.tickSize(-graphicopt.heightG(), 0, 0).tickFormat(''));

        if (hasSlider) {
            var yearStep = 1000 * 60 * 60 * 24 * 365;
            var sliderContainer = svg
                .append('g')
                .attr("class", "filter-slider")
                .attr('transform', `translate(60,5)`);

            var slider = d3.sliderVertical()
                .max(new Date(dataShadow[0].key, 1, 1))
                .min(new Date(dataShadow[dataShadow.length - 1].key, 1, 1))
                .step(yearStep)
                .default([new Date(dataShadow[dataShadow.length - 1].key, 1, 1), new Date(dataShadow[0].key, 1, 1)])
                .fill('#2196f3')
                .tickFormat(d3.timeFormat('%Y'))
                .height(graphicopt.heightG() - 10)
                .on('end', values => {
                    var fromYear = new Date(values[0]);
                    var toYear = new Date(values[1]);
                    var rangeLabel = fromYear.getFullYear() + "-" + toYear.getFullYear();
                    updateYearRangeFilter({
                        type: 'ConstYear',
                        text: rangeLabel,
                        id: rangeLabel,
                        from: fromYear.getFullYear(),
                        to: toYear.getFullYear()
                    }, false);
                });

            yearRangeFilter.min = new Date(dataShadow[0].key, 1, 1).getFullYear();
            yearRangeFilter.max = new Date(dataShadow[dataShadow.length - 1].key, 1, 1).getFullYear();

            sliderContainer.call(slider);

            sliderContainer.selectAll();

            yAxisSelected.selectAll(".tick text").each(function (d, i) {
                if (d % 5 !== 0) d3.select(this).remove();
            })
        }

        let bar_g = g_shadow.selectAll(".barS")
            .data(dataShadow, d => d.key);

        bar_g.exit().remove();

        let bar_g_n = bar_g.enter()
            .append("g")
            .attr("class", "barS")
            .attr('transform', d => `translate(${graphicopt.heightG()},${y(d.key)})`)

        if (!hasSlider) {
            bar_g_n.on('click', function (d) {
                const current_state = d3.select(this).classed('selected');
                d3.select(this).classed('selected', !current_state);
                filterChangeFunc({id: d.key, text: d.key, type: master.id}, !current_state);
            });
        }

        bar_g_n.append("rect").attr("width", 0).attr("height", y.bandwidth());

        bar_g = bar_g_n.merge(bar_g)
            .style("display", d => {
                return d.value.len === null ? "none" : null;
            })
            .style("fill", d => {
                return graphicopt.barcolor;
            })
            .attr('transform', d => `translate(1,${y(d.key)})`);

        bar_g.selectAll('rect')
            .transition()
            .duration(500)
            .attr("x", 0)
            .attr("height", y.bandwidth())
            .attr("width", d => {
                return x(d.value.len);
            });

        bar_g = overlayg.selectAll(".barOverlay")
            .data(dataShadow, d => d.key);

        bar_g.exit().remove();

        bar_g_n = bar_g.enter()
            .append("g")
            .attr("class", "barOverlay")
            .attr('transform', d => `translate(5,${y(d.key)})`)
            .on('mouseover', function (e) {
                maing.selectAll('.label').filter(d => d.key === e.key).classed('hide', false);
            }).on('mouseleave', function (e) {
                maing.selectAll('.label').filter(d => d.key === e.key).classed('hide', true);
            });
        if (!hasSlider) {
            bar_g_n.on('click', function (d) {
                const current_state = d3.select(this).classed('selected');
                d3.select(this).classed('selected', !current_state);
                filterChangeFunc({id: d.key, text: d.key, type: master.id}, !current_state);
            });
        }
        bar_g_n.append("rect").attr("width", graphicopt.widthG()).attr("height", y.bandwidth());

        return schemabox;
    }

    function draw(dataset) {
        drawHorizontal(dataset);
    }

    function drawHorizontal(dataset) {
        var maxValue = Math.ceil(Math.max(...dataShadow.map(d => d.value.len)) / 10) * 10;
        x.domain([0, maxValue]);

        let bar_g = maing.selectAll(".bar")
            .data(dataset, d => d.key);

        bar_g.exit().remove();

        let bar_g_n = bar_g.enter()
            .append("g")
            .attr("class", "bar")
            .attr('transform', d => `translate(${graphicopt.heightG()},${y(d.key)})`)
            .on('mouseover', function () {
                d3.select(this).select('.label').classed('hide', false);
            }).on('mouseleave', function () {
                d3.select(this).select('.label').classed('hide', true);
            })
        // .on('click',function(d){
        //     const current_state = d3.select(this).classed('selected');
        //     d3.select(this).classed('selected',!current_state);
        //     filterChangeFunc({id:d.key,text:d.key,type:master.id},!current_state);
        // });

        var rects = bar_g_n.selectAll('rect')
            .data(function (d) {
                return d.value.stack;
            });

        rects.enter()
            .append('rect')
            .attr('width', 0)
            .attr('height', y.bandwidth()).exit().remove();

        bar_g_n.append("text").attr("class", "label hide")
            .style('text-anchor', 'middle')
            .attr("y", (d => {
                return (y.bandwidth() / 2);
            }));

        bar_g = bar_g_n.merge(bar_g)
            .style("display", d => {
                return d.value.len === null ? "none" : null;
            })
            .style("fill", d => {
                return graphicopt.barcolor;
            })
            .attr('transform', d => `translate(1,${y(d.key)})`);

        bar_g.selectAll('rect')
            .data(function (d) {
                return d.value.stack;
            })
            .transition()
            .duration(500)
            .attr("x", d => x(d['0']))
            .attr("height", y.bandwidth())
            .attr("width", d => {
                return x(d['1'] - d['0']);
            })
            .style("fill", function (d) {
                return colors(d.project);
            });

        bar_g.select('.label')
            .transition()
            .duration(500)
            .attr("y", y.bandwidth())
            .attr("x", d => x(d.value.len) + 25)
            .text(d => d.value.len)
            .attr("dx", "-.7em");
    }

    schemabox.init = function () {
        svg.attrs({
            width: graphicopt.width,
            height: graphicopt.height
            // overflow: "visible",

        });
        svg.classed('hide', true);
        g = svg.append("g")
            .attr('class', 'pannel')
            .attr('transform', `translate(${graphicopt.margin.left},${graphicopt.margin.top})`);

        g.append("g")
            .attr("class", "grid")
            .attr("transform", "translate(0,0)");

        g_shadow = g.append("g")
            .attr("class", "shadow");

        g.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(0,0)");

        g.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0,0)`);


        maing = g.append("g")
            .attr("class", "main");
        overlayg = g.append("g")
            .attr("class", "overlay");
        return schemabox;
    };
    schemabox.data = function (_) {
        if (arguments.length) {
            data = _;
            if (visibility) {
                svg.classed('hide', false);
                draw(data);
            } else
                svg.classed('hide', true);
            return schemabox;
        } else
            return data;
    };
    schemabox.dataShadow = function (_) {
        if (arguments.length) {
            dataShadow = _;
            return schemabox;
        } else
            return dataShadow;
    };
    schemabox.graphicopt = function (_) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in _) {
                if ('undefined' !== typeof _[i]) {
                    graphicopt[i] = _[i];
                }
            }
            x.range([0, graphicopt.widthG()]);
            y.range([graphicopt.heightG(), 0]);
            return schemabox;
        } else {
            return graphicopt;
        }

    };
    schemabox.filterChangeFunc = function (_) {
        return arguments.length ? (filterChangeFunc = _, schemabox) : filterChangeFunc;
    };

    schemabox.svg = function (_) {
        return arguments.length ? (svg = _, schemabox) : svg;
    };
    schemabox.master = function (_) {
        return arguments.length ? (master = _, schemabox) : master;
    };
    schemabox.visibility = function (_) {
        return arguments.length ? (visibility = _, schemabox) : visibility;
    };
    return schemabox;
}