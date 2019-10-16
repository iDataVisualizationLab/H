function createVennIntersect(vennSvg, counter) {

  var sets = [{'sets': ['IoT'], 'label': 'IoT', size: counter.A},
    {'sets': ['Big Data'], 'label': 'Big Data', size: counter.B},
    {'sets': ['Security'], 'label': 'Security', size: counter.D},
    {'sets': ['IoT', 'Big Data'], 'label': 'IoT_Big Data', size: counter.AB},
    {'sets': ['IoT', 'Security'], 'label': 'IoT_Security', size: counter.AD},
    {'sets': ['Big Data', 'Security'], 'label': 'Big Data_Security', size: counter.BD},
    {'sets': ['IoT', 'Big Data', 'Security'], 'label': 'IoT_Big Data_Security', size: counter.ABD}
  ];

  function getIntersectionAreasMapping() {
    let intersectionAreasMapping = {};
    let vennAreas = d3.selectAll(".venn-area");
    vennAreas.each((areaData, areaIdx, areas) => {
      let area = areas[areaIdx];
      let areaSets = areaData.sets;
      let areaSelection = d3.select(area);
      let areaD = areaSelection.select("path").attr("d");
      let areaSetsId = area.dataset.vennSets;
      let intersectedAreas = d3.selectAll(".venn-area")
        .filter((cAreaData, cAreaIdx, cAreas) => {
          let cAreaSetsId = cAreas[cAreaIdx].dataset.vennSets;
          let cAreaSets = cAreaData.sets;
          let isContained = areaSets.every(setId => cAreaSets.indexOf(setId) > -1);
          return (isContained && cAreaSetsId !== areaSetsId);
        })
        .nodes()
        .map(intersectedArea => {
          let intersectedAreaSelection = d3.select(intersectedArea);
          return {
            sets: intersectedAreaSelection.data()[0].sets,
            d: intersectedAreaSelection.select("path").attr("d")
          }
        });

      intersectionAreasMapping[areaSetsId] = {
        vennArea: {
          sets: areaSets,
          d: areaD
        },
        intersectedAreas: intersectedAreas
      };
    });
    console.log(intersectionAreasMapping);
    return intersectionAreasMapping;
  }

  function appendVennAreaParts(svg, intersectionAreasMapping) {
    for (let areaSetsId in intersectionAreasMapping) {
      let intersectionAreasItem = intersectionAreasMapping[areaSetsId];
      let vennArea = intersectionAreasItem.vennArea;
      let intersectedAreas = intersectionAreasItem.intersectedAreas;
      let partId = getPartId(vennArea, intersectedAreas);
      let d = [vennArea.d].concat(intersectedAreas.map(intersectedArea => intersectedArea.d));
      appendVennAreaPart(svg, d.join(""), partId);
    }
  }

  function appendLabels(svg, labels) {
    labels.nodes().forEach(label => {
      svg.append(function() {
        return label;
      });
    });
  }

  function appendVennAreaPart(svg, d, partId) {
    svg.append("g")
      .attr("class", "venn-area-part")
      .attr("venn-area-part-id", partId)
      .append("path")
      .attr("d", d)
      .attr("fill-rule", "evenodd");
  }

  function appendPatterns(defs) {
    let colors = ["none", "#009fdf"];
    colors.forEach((color, idx) => {
      let diagonal = defs.append("pattern")
        .attr("id", "diagonal" + idx)
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", "10")
        .attr("height", "10");
      diagonal.append('rect')
        .attr("width", "10")
        .attr("height", "10")
        .attr("x", "0")
        .attr("y", "0")
        .attr("fill", color)
        .attr("fill-opacity", "0.15");
      diagonal.append("path")
        .attr("d", "M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2")
        .attr("stroke", "#000000")
        .attr("opacity", "1")
        .attr("stroke-width", "1");
    })
  }

  function getPartId(vennArea, intersectedAreas) {
    let partId = "(" + vennArea.sets.join("∩") + ")";
    partId += intersectedAreas.length > 1 ? "\\(" : "";
    partId += intersectedAreas.length === 1 ? "\\" : "";
    partId += intersectedAreas.map(intersectedArea => intersectedArea.sets).map(set => "(" + set.join("∩") + ")").join("∪");
    partId += intersectedAreas.length > 1 ? ")" : "";
    return partId;
  }

  function bindVennAreaPartListeners() {
    div.selectAll("g")
      .on("mouseover", function(d, i) {
        let node = d3.select(this);
        let nodePath = node.select("path");
        let nodeAlreadySelected = node.classed("selected");
        nodePath.attr("style", nodeAlreadySelected ? "fill: url(#diagonal1)" : "fill: #009fdf; fill-opacity: 0.15");
      })
      .on("mouseout", function(d, i) {
        let node = d3.select(this);
        let nodePath = node.select("path");
        let nodeAlreadySelected = node.classed("selected");
        nodePath.attr("style", nodeAlreadySelected ? "fill: url(#diagonal0)" : "fill: #ffffff");
      })
      .on("click", function(d,i) {
        let node = d3.select(this);
        let nodePath = node.select("path");
        let nodeAlreadySelected = node.classed("selected");
        let nodePathStyle = (!nodeAlreadySelected ? "fill: url(#diagonal1)" : "fill: #ffffff");
        nodePath.attr("style", nodePathStyle);
        node.classed("selected", !nodeAlreadySelected);
      });
  }

  function removeOriginalVennAreas() {
    d3.selectAll("g.venn-area").remove();
  }

  function getPathCentroid() {
    let texts = d3.select(".network-container").select("svg").select("svg").select("svg").selectAll("text");
    let pathCenter = [];

    texts._groups[0].forEach(function (d) {
      let bbox = d.getBBox();

      pathCenter.push({
        name: d.children[0].innerHTML.split("_").join(" "),
        x: bbox.x + bbox.width / 2,
        y: bbox.y + bbox.height / 2,
        data: d
      })
    });

    return pathCenter;
  }

  var chart = venn.VennDiagram().width(width).height(height);
  let div = vennSvg.datum(sets).call(chart);
  let svg = div.select("svg");
  let defs = svg.append("defs");
  let labels = div.selectAll("text").remove();
  let intersectionAreasMapping = getIntersectionAreasMapping();

  appendPatterns(defs);
  appendVennAreaParts(svg, intersectionAreasMapping);
  appendLabels(svg, labels);
  bindVennAreaPartListeners();
  removeOriginalVennAreas();

  return getPathCentroid(svg);
}
