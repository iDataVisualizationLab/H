let Schemabox = function() {
    let graphicopt = {
            margin: {top: 20, right: 0, bottom: 0, left: 0},
            width: 250,
            height: 50,
            scalezoom: 10,
            barcolor: 'red',
            widthView: function(){return this.width*this.scalezoom},
            heightView: function(){return this.height*this.scalezoom},
            widthG: function(){return this.widthView()-this.margin.left-this.margin.right},
            heightG: function(){return this.heightView()-this.margin.top-this.margin.bottom},
        },
        svg,g,visibility,filterChangeFunc=function(){},master={},dataShadow=[],g_shadow,maing,overlayg,
    data =[];
    let schemabox ={};
    var x = d3.scaleBand()
        .range([0, graphicopt.widthG()])
        .padding(0.1);
    var y = d3.scaleLinear()
        .range([graphicopt.heightG(), 0]);

    schemabox.draw_Shadow = function(){
        x.domain(dataShadow.map( d => { return d.key; }));
        // y.domain([0, d3.max(dataset,  d => { return d.value.len; })]);
        // y.domain(d3.extent(dataset,d=>d.value.len));
        y.domain(dataShadow.range);

        var xAxis = d3.axisBottom(x).tickSize([]).tickPadding(10);
        g.select(".x.axis")
            .call(xAxis);

        let bar_g = g_shadow.selectAll(".barS")
            .data(dataShadow,d=>d.key);

        bar_g.exit().remove();

        let bar_g_n = bar_g.enter()
            .append("g")
            .attr("class", "barS")
            .attr('transform',d=>`translate(${x(d.key)},${graphicopt.heightG()})`)
            // .on('mouseover',function(){
            //     d3.select(this).select('.label').classed('hide',false);
            // }).on('mouseleave',function(){
            //     d3.select(this).select('.label').classed('hide',true);
            // })
            .on('click',function(d){
                const current_state = d3.select(this).classed('selected');
                d3.select(this).classed('selected',!current_state);
                filterChangeFunc({id:d.key,text:d.key,type:master.id},!current_state);
            });
        bar_g_n.append("rect").attr("width", x.bandwidth()).attr("height", 0);

        // bar_g_n.append("text").attr("class", "label hide")
        //     .style('text-anchor','middle')
        //     .attr("x", ( d => { return (x.bandwidth() / 2); }));

        bar_g = bar_g_n.merge(bar_g)
            .style("display", d => { return d.value.len === null ? "none" : null; })
            .style("fill",  d => {
                return graphicopt.barcolor;
            })
            .attr('transform',d=>`translate(${x(d.key)},0)`);

        bar_g.selectAll('rect')
            .transition()
            .duration(500)
            .attr("y",  d => { return y(d.value.len); })
            .attr("width", x.bandwidth())
            .attr("height",  d => { return graphicopt.heightG() - y(d.value.len); });

        bar_g = overlayg.selectAll(".barOverlay")
            .data(dataShadow,d=>d.key);

        bar_g.exit().remove();

        bar_g_n = bar_g.enter()
            .append("g")
            .attr("class", "barOverlay")
            .attr('transform',d=>`translate(${x(d.key)},${0})`)
            .on('mouseover',function(e){
                maing.selectAll('.label').filter(d=>d.key===e.key).classed('hide',false);
            }).on('mouseleave',function(e){
                maing.selectAll('.label').filter(d=>d.key===e.key).classed('hide',true);
            })
            .on('click',function(d){
                const current_state = d3.select(this).classed('selected');
                d3.select(this).classed('selected',!current_state);
                filterChangeFunc({id:d.value.val,text:d.key,type:master.id},!current_state);
            });
        bar_g_n.append("rect").attr("width", x.bandwidth()).attr("height", graphicopt.heightG());
        // bar_g_n.append("text").attr("class", "label hide")
        //     .style('text-anchor','middle')
        //     .attr("x", ( d => { return (x.bandwidth() / 2); }));

        return schemabox;
    }

    function draw(dataset){
        let bar_g = maing.selectAll(".bar")
             .data(data, d=>d.key);

        console.log(dataset);

        bar_g.exit().remove();

        let bar_g_n = bar_g.enter()
            .append("g")
            .attr("class", "bar")
            .attr('transform',d=>`translate(${x(d.key)},${graphicopt.heightG()})`)
            .on('mouseover',function(){
                d3.select(this).select('.label').classed('hide',false);
            }).on('mouseleave',function(){
                d3.select(this).select('.label').classed('hide',true);
            })
            // .on('click',function(d){
            //     const current_state = d3.select(this).classed('selected');
            //     d3.select(this).classed('selected',!current_state);
            //     filterChangeFunc({id:d.key,text:d.key,type:master.id},!current_state);
            // });

        // console.log(dataset);

        var group = bar_g_n
            .append("g")
            .attr("class", "group");

        bar_g_n.selectAll("rect")
            .data(function (d) {
                return d.value.stack;
            })
            .enter()
            .append("rect");

        // group.append("rect").attr("width", x.bandwidth()).attr("height", 0);

        bar_g_n.append("text").attr("class", "label hide")
            .style('text-anchor','middle')
            .attr("x", ( d => { return (x.bandwidth() / 2); }));

        bar_g = bar_g_n.merge(bar_g)
            .style("display", d => { return d.value.len === null ? "none" : null; })
            .style("fill",  d => {
                return graphicopt.barcolor;
            })
            .attr('transform',d=>`translate(${x(d.key)},0)`);


        bar_g.selectAll('rect')
            .transition()
            .duration(500)
            .attr("y",  d => {console.log(d['0']+d['1']); return y(d['1']); })
            .attr("width", x.bandwidth())
            .attr("height",  d => { return graphicopt.heightG() - y(d['1'] - d['0']); })
            .style("fill", function (d) {
                return colors(d.project);
            });


        bar_g.select('.label')
            .transition()
            .duration(500)
            .attr("x", ( d => { return (x.bandwidth() / 2); }))
            .attr("y",  d => { return y(d.value.len) + .1; })
            .text( d => d.value.len )
            .attr("dy", "-.7em")
        ;
    }

    schemabox.init = function () {
        svg.attrs({
            width: graphicopt.width,
            height: graphicopt.height,
            // overflow: "visible",

        });
        svg.classed('hide',true);
        g = svg.append("g")
            .attr('class','pannel')
            .attr('transform',`translate(${graphicopt.margin.left},${graphicopt.margin.top})`);
        g_shadow = g.append("g")
            .attr("class", "shadow");
        g.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + graphicopt.heightG() + ")");

        maing = g.append("g")
            .attr("class", "main");
        overlayg = g.append("g")
            .attr("class", "overlay");
        return schemabox;
    };
    schemabox.data = function (_) {
        if (arguments.length){
            data=_;
            if (visibility) {
                svg.classed('hide',false);
                draw(data);
            }else
                svg.classed('hide',true);
            return schemabox;
        }else
            return data;
    };
    schemabox.dataShadow = function (_) {
        if (arguments.length){
            dataShadow=_;
            return schemabox;
        }else
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
        }else {
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