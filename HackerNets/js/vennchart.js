function createVenn(data) {

  function getPathCentroid() {
    let texts = vennSvg.selectAll(".venn-area")
      .select("text");
    let pathCenter = [];

    texts._groups[0].forEach(function (d) {
      let bbox = d.getBBox();

      pathCenter.push({
        name: d.parentElement.getAttribute("data-venn-sets").split("_").join(" "),
        x: bbox.x + bbox.width / 2,
        y: bbox.y + bbox.height / 2,
        data: d
      })
    });

    return pathCenter;
  }

  function draw(svg, counter) {
    let sets = [{'sets': ['IoT'], 'label': 'IoT', size: counter.A},
      {'sets': ['Big Data'], 'label': 'Big Data', size: counter.B},
      {'sets': ['Security'], 'label': 'Cybersecurity', size: counter.D},
      {'sets': ['IoT', 'Big Data'], 'label': 'IoT - Big Data', size: counter.AB},
      {'sets': ['IoT', 'Security'], 'label': 'IoT - Cybersecurity', size: counter.AD},
      {'sets': ['Big Data', 'Security'], 'label': 'Big Data - Cybersecurity', size: counter.BD},
      {'sets': ['IoT', 'Big Data', 'Security'], 'label': 'I - B - S', size: counter.ABD}
    ];

    console.log(sets);

    let vennChart = venn.VennDiagram()
      .width(width)
      .height(800);

    svg.datum(sets)
      .call(vennChart)
      .on('mouseover',);

    let tooltip = d3.select("body").append("div")
      .attr("class", "venntooltip");

    svg.selectAll("path")
      .style("stroke-opacity", 0)
      .style("stroke", "#fff")
      .style("stroke-width", 3)
      .attr("fill", function (d) {
        return "black";
      });

    svg.selectAll("g")
      .on("mouseover", function (d) {
        venn.sortAreas(svg, d);
        tooltip.transition().duration(400).style("opacity", .9);
        tooltip.text(d.label);
        var selection = d3.select(this).transition("tooltip").duration(400);
        selection.select("path")
          .style("fill-opacity", d.sets.length === 1 ? .4 : .1)
          .style("stroke-opacity", 1);
      })
      .on("mousemove", function () {
        tooltip.style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function (d) {
        tooltip.transition().duration(400).style("opacity", 0);
        var selection = d3.select(this).transition("tooltip").duration(400);
        selection.select("path")
          .style("fill-opacity", d.sets.length === 1 ? .15 : .0)
          .style("stroke-opacity", 0);
      });
  }

  function processVennData(data) {
    const topics = [];
    data.forEach(function (d) {
      d.topic.forEach(function (e) {
        if (!topics.includes(e)) {
          topics.push(e);
        }
      })
    });

    let usersContribution = {};
    nodes.forEach(function (d) {
      usersContribution[d.key] = {iot: 0, bigdata: 0, cps: 0, security: 0};
    });

    data.forEach(function (d) {

      d.topic.forEach(function (e) {
        if (usersContribution[d.by]) {
          usersContribution[d.by][e] += 1;
        }
      })
    });

    return usersContribution
  }

  function calculateIntersection(usersContribution) {
    // Map: iot -> A, big data -> B, cps -> C, security -> D
    let countA = 0,
      countB = 0,
      countC = 0,
      countD = 0,
      countAB = 0,
      countAC = 0,
      countAD = 0,
      countBC = 0,
      countBD = 0,
      countCD = 0,
      countABC = 0,
      countABD = 0,
      countACD = 0,
      countBCD = 0,
      countABCD = 0;

    Object.keys(usersContribution).forEach(function (d) {
      let item = usersContribution[d];
      let A = +item.iot, B = +item.bigdata, C = +item.cps, D = +item.security;

      if (A) countA++;
      if (B) countB++;
      if (C) countC++;
      if (D) countD++;
      if (A && B) countAB++;
      if (A && C) countAC++;
      if (A && D) countAD++;
      if (B && C) countBC++;
      if (B && D) countBD++;
      if (C && D) countCD++;
      if (A && B && C) countABC++;
      if (A && B && D) countABD++;
      if (A && C && D) countACD++;
      if (B && C && D) countBCD++;
      if (A && B && C && D) countABCD++;
    });

    return {
      A: countA,
      B: countB,
      C: countC,
      D: countD,
      AB: countAB,
      AC: countAC,
      AD: countAD,
      BC: countBC,
      BD: countBD,
      CD: countCD,
      ABC: countABC,
      ABD: countABD,
      ACD: countACD,
      BCD: countBCD,
      ABCD: countABCD
    };
  }

  const usersContribution = processVennData(data);

  const counter = calculateIntersection(usersContribution);
  mainSvg.select(".venn").remove();
  let vennSvg = mainSvg.append("svg")
    .attr("class", "venn")
    .attr("width", width)
    .attr("height", 800)
    .attr("transform", "translate(0,100)");

  draw(vennSvg, counter);

  return getPathCentroid();

}


