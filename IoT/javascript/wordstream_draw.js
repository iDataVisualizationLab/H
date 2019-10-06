let texts = null;
let dateLabels = [];
function draw(data) {
    //Layout data
    let width = wordStreamWidth;
    let height = wordStreamHeight;
    let font = "Arial";
    let interpolation = d3.curveCardinal;
    let ws = d3.wordStream()
        .size([width, height])
        .interpolate(interpolation)
        .fontScale(d3.scaleLinear())
        .minFontSize(8)
        .maxFontSize(24)
        .data(data)
        .font(font);
    let boxes = ws.boxes();
    boxes.data.forEach(row =>{
        dateLabels.push(row.date);
    });
    let allWords = [];
    d3.map(boxes.data, function (row) {
        boxes.topics.forEach(topic => {
            row.words[topic].forEach(w => {
                w.id = (w.text + row.date);
                w.type = "word";
            });//add id for selection purpose.
            allWords = allWords.concat(row.words[topic]);
        });
    });
    let c10 = d3.scaleOrdinal(d3["schemeCategory10"]);
    // //Color based on term
    // let uniqueTerms = d3.set(allWords, w=>w.text).values();
    // let termColorMap = d3.scaleOrdinal().domain(uniqueTerms).range(c10.range());
    let terms = [];
    d3.map(boxes.data, function (row) {
        boxes.topics.forEach(topic => {
            terms = terms.concat(row.words[topic].slice(0, 10));//take top 10 terms from each box
        });
    });
    //resort terms
    terms = terms.sort((a, b) => b.frequency - a.frequency);
    let uniqueTerms = d3.set(terms, d => d.text).values().slice(0, 10);//take top 10 unique terms
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

    let placed = true;
    //Remove all existing data if there is.
    mainGroup.selectAll(".wordStreamGroup").remove();

    texts = mainGroup.append("g").attr("class", "wordStreamGroup").attr("transform", `translate(${margin.axisx}, 0)`).selectAll('g').data(allWords).enter().append('g');
    texts
        .attr("transform", function (d) {
            return 'translate(' + d.x + ', ' + d.y + ')rotate(' + d.rotate + ')';
        })
        .append('text')
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
            if (!clicked) {
                mainGroup.selectAll("circle").classed("faded", true);
                mainGroup.selectAll(".wordletext").classed("faded", true);
                dispatch.call("down", null, d);
            }

        })
        .on("mouseleave", () => {
            if (!clicked) {
                mainGroup.selectAll(".faded").classed("faded", false);
                links.selectAll("*").remove();
                mainGroup.selectAll(".brushed").classed("brushed", false);
            }
        })
        .on("click", ()=>{
            clicked = !clicked;
        });
    // //This section is to set the autocomplete word
    autocomplete(document.getElementById("theWord"), d3.set(allWords.filter(w=>w.placed).map(w=>w.text)).values());
}

