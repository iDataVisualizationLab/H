let texts = null;
let dateLabels = [];

function draw(data, drawAxis) {
    //Layout data
    let width = wordStreamWidth;
    let height = wordStreamHeight;
    let font = "Arial";
    let interpolation = d3.curveCardinal;
    let pictureSize = 20;
    let pictureShape = "circle";
    let pictureFrequency = 100;//One picture can be counted as this number of words for frequency
    let ws = d3.wordStream()
        .size([width, height])
        .interpolate(interpolation)
        .fontScale(d3.scaleLinear())
        .minFontSize(12)
        .maxFontSize(30)
        .pictureSize(pictureSize)
        .pictureShape(pictureShape)
        .pictureFrequency(pictureFrequency)
        .data(data)
        .font(font);
    let boxes = ws.boxes();

    console.log(ws)

    boxes.data.forEach(row => {
        dateLabels.push(row.date);
    });
    //sort the date labels

    //Add the circle clip-path if needed
    mainGroup.append("defs")
        .append("clipPath")
        .attr("id", (d) => {
            return "clipPathPicture";
        })
        .append("circle")
        .attr("fill", "black")
        .attr("r", pictureSize/2);

    if (drawAxis) {
        //The x-axis

        let xAxisScale = d3.scaleBand().domain(dateLabels).range([0, width]);

        // let xAxisScale = d3.scaleTime().domain(d3.extent(dateLabels)).range([0, width]);
        let axisx = mainGroup.append("g")
            .attr("class", 'axis axis--x')
            .attr("transform", `translate(${margin.axisx},${wordStreamHeight-30})`)
            .call(d3.axisBottom(xAxisScale));
    }

    //Displaying the streams
    let area = d3.area()
        .curve(interpolation)
        .x(function (d) {
            return (d.x);
        })
        .y0(function (d) {
            return d.y0;
        })
        .y1(function (d) {
            return (d.y0 + d.y);
        });
    let topics = boxes.topics;
    let streamColors = d3.scaleOrdinal(d3.schemeCategory10);

    console.log(boxes);

    mainGroup.append("g").attr("class", "topicStreamGroup")
        .attr("transform", `translate(${margin.axisx}, 0)`)
        .selectAll('path')
        .data(boxes.layers)
        .enter()
        .append('path')
        .attr('d', area)
        .style('fill', function (d, i) {
            return streamColors(i);
        })
        .attr('fill-opacity', 0.1)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.3)
        .attr('topic', (_, i) => topics[i]);


    let allWords = [];
    d3.map(boxes.data, function (row) {
        boxes.topics.forEach(topic => {
            row.words[topic].forEach(w => {
                w.id = (w.text + row.date);
            });//add id for selection purpose.
            allWords = allWords.concat(row.words[topic]);
        });
    });
    let c10 = d3.scaleOrdinal(d3["schemeCategory10"]);
    let terms = [];
    d3.map(boxes.data, function (row) {
        boxes.topics.forEach(topic => {
            terms = terms.concat(row.words[topic].slice(0, 10));//take top 10 terms from each box
        });
    });
    //resort terms
    terms = terms.sort((a, b) => b.frequency - a.frequency);
    let uniqueTerms = d3.set(terms, d => d.text).values().slice(0, 20);//take top 10 unique terms
    let termColor = d3.scaleOrdinal()
        .domain(uniqueTerms)
        .range(c10.range());
    let termColorMap = function (text) {
        if (uniqueTerms.indexOf(text) >= 0) {
            return termColor(text);
        } else {
            return "#aaa";
        }
    }
    //Toggle the display words as placed or not being able to place in the stream
    let placed = true;
    //Remove all existing data if there is.
    mainGroup.selectAll(".wordStreamGroup").remove();

    texts = mainGroup.append("g").attr("class", "wordStreamGroup")
        .attr("transform", `translate(${margin.axisx}, 0)`).selectAll('g')
        .data(allWords).enter().append('g').attr("transform", function (d) {
            return 'translate(' + d.x + ', ' + d.y + ')rotate(' + d.rotate + ')';
        }).call(placeSprite);


    function placeSprite(theElm) {
        //Place the texts
        theElm.each(function (d) {
            let elm = d3.select(this);
            if (d.type == "picture") {
                elm.append('image')
                    .attr("xlink:href", `data/instagrams/${d.text}.jpg`)
                    .attr("width", d.width)
                    .attr("height", d.height)
                    .attr("x", -pictureSize / 2) //20 is the picture size so get back 1/2
                    .attr("y", -pictureSize / 2)
                    .attr("clip-path", (d) => "url(#clipPathPicture)")
                    .attr("visibility", function (d) {
                        return d.placed ? (placed ? "visible" : "hidden") : (placed ? "hidden" : "visible");
                    }).on("mouseover", function (d) {
                        showTip(`<img src='data/instagrams/${d.text}.jpg' width="200px" height="200px"/>`);
                        console.log(`called ${d.text}`)
                    }
                ).on("mouseout", function (d) {
                    hideTip();
                });

            } else {
                elm.append('text')
                    .attr("class", "wordletext")
                    .text(function (d) {
                        return d.text;
                    })
                    .attr("id", d => ("id" + (d.id)))
                    .attr("font-family", font)
                    .attr("font-size", function (d) {
                        return d.fontSize;
                    })
                    .attr("fill", function (d, i) {
                        return termColorMap(d.text);
                    })
                    .attr('text-anchor', 'middle')
                    .attr('alignment-baseline', 'middle')
                    .attr("topic", function (d) {
                        return d.topic;
                    })
                    .attr("visibility", function (d) {
                        return d.placed ? (placed ? "visible" : "hidden") : (placed ? "hidden" : "visible");
                    })
                    .style("cursor", "pointer")
                    .on("mouseover", d => {//Todo: Can generalize this together with the cells so we don't have to re-code
                        // if (!clicked) {
                        //     mainGroup.selectAll("circle").classed("faded", true);
                        //     mainGroup.selectAll(".wordletext").classed("faded", true);
                        //     dispatch.call("down", null, d);
                        // }
                    })
                    .on("mouseleave", () => {
                        // if (!clicked) {
                        //     mainGroup.selectAll(".faded").classed("faded", false);
                        //     links.selectAll("*").remove();
                        //     mainGroup.selectAll(".brushed").classed("brushed", false);
                        // }
                    })
                    .on("click", () => {
                        // clicked = !clicked;
                    });
            }
        });
    }

    // //This section is to set the autocomplete word
    // autocomplete(document.getElementById("theWord"), d3.set(allWords.filter(w=>w.placed).map(w=>w.text)).values());
}

