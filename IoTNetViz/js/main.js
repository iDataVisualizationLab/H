let width = 1600,
  height = 1000;

let center = {x: width / 2, y: height / 2};
let vennCenters = null;
let color = d3.scaleOrdinal(d3.schemeCategory10);

let mainSvg = d3.select("#main-chart");
let filterSvg = d3.select('#filter-svg');

let nodes = null;
let idToUsername = null;
let links = null;
let userName = null;
let toggle = true;


function createFilter(rawData) {
  var minYear = rawData[0].time, maxYear = rawData[0].time;

  rawData.forEach(function (d) {
    if (d.time < minYear) {
      minYear = d.time;
    }
    if (d.time > maxYear) {
      maxYear = d.time;
    }
  });

  var minTime = new Date(minYear * 1000);
  var maxTime = new Date(maxYear * 1000);

  var filters = filterSvg
    .attr("class", "filters");

  var sliderContainer = filters.append("g")
    .attr("class", "filter-slider")
    .attr("transform", `translate(250, 160)`);

  var slider = d3.sliderHorizontal()
    .min(new Date(minTime.getFullYear(), minTime.getMonth(), minTime.getDay()))
    .max(new Date(maxTime.getFullYear(), maxTime.getMonth(), maxTime.getDay()))
    .step(1)
    .default([new Date(maxTime.getFullYear(), maxTime.getMonth(), maxTime.getDay()), new Date(minTime.getFullYear(), minTime.getMonth(), minTime.getDay())])
    .fill('#2196f3')
    .tickFormat(d3.timeFormat('%Y'))
    .width(1000)
    .on('end', values => {
      var newData = timeFilter(rawData, values);
      var data = preprocessData(newData);
      updateData(data);
      updateNetwork(mainSvg);
    });

  sliderContainer.call(slider);


  var toggles = filters.append('g')
    .attr("class", "toggles")
    .attr("stroke", "#999")
    .attr("transform", "translate(50,170)");


  toggles.append("image")
    .attr("id", "toggle-on")
    .attr("href", "image/toggle-on-solid.svg")
    .attr("width", "30px")
    .style("display", "block");

  toggles.append("image")
    .attr("id", "toggle-off")
    .attr("href", "image/toggle-off-solid.svg")
    .attr("width", "30px")
    .style("display", "none");

  toggles.append("text")
    .attr("x", 35)
    .attr("y", 17)
    .attr("id", "toggle-text")
    .text("Hide Venn-chart");

  toggles.on("click", function () {
    if (toggle) {
      toggles.select("#toggle-on").style("display", "none");
      toggles.select("#toggle-off").style("display", "block");
      toggles.select("#toggle-text").text("Show Venn-chart");
      hideVenn()
    } else {
      toggles.select("#toggle-off").style("display", "none");
      toggles.select("#toggle-on").style("display", "block");
      toggles.select("#toggle-text").text("Hide Venn-chart");
      showVenn()
    }

    toggle = !toggle;
  });
}

function showVenn() {
  mainSvg.select('.venn').attr("visibility", "show");
}

function hideVenn() {
  mainSvg.select('.venn').attr("visibility", "hidden");
}

function createChart(data) {
  mainSvg.selectAll("*").remove();

  mainSvg.attr("width", width)
    .attr("height", height);

  filterSvg.attr("width", width)
    .attr("height", 200);

  nodes = createNodes(data);
  userName = nodes.map(d => d.key);
  idToUsername = idToUsernameMap();
  links = createLinks(data);

  vennCenters = createVenn(data);

  createForce(vennCenters);

  mainSvg.select(".venn").select('svg').selectAll('g').select('text').style('visibility', 'hidden');

}


function updateData(data) {
  nodes = createNodes(data);
  console.log(nodes);
  userName = nodes.map(d => d.key);
  idToUsername = idToUsernameMap();
  links = createLinks(data);
}

function idToUsernameMap() {
  var map = {};
  nodes.forEach(function (d) {
    d.values.forEach(function (v) {
      map[v.id] = d.key;
    })
  });

  return map;
}

function timeFilter(data, values) {
  return data.filter(d => d.time * 1000 <= values[1] && d.time * 1000 >= values[0])
}

function createNodes(data) {
  var temp = d3.nest().key(d => d.by).entries(data);

  return temp.filter(function (d) {
    return d.values.length >= 25;
  });
}

function updateNodeConnections(key, nodes) {
  nodes.forEach(function (d, i) {
    if (d.key === key) {
      if (d.connections) {
        nodes[i].connections += 1;
      } else {
        nodes[i]['connections'] = 1;
      }
    }
  });
}

function createLinks(data) {
  var tempLinks = [];

  data.forEach(function (d) {
    var name = d.by;
    var parentId = d.parent;
    var label = d.label;
    var parentName = idToUsername[parentId];
    var source = '';
    var target = '';

    if (!userName.includes(name) || !userName.includes(parentName)) {
      return;
    }

    if (name > parentName) {
      source = parentName;
      target = name;
    } else {
      source = name;
      target = parentName;
    }

    if (parentId && parentName) {
      updateNodeConnections(name, nodes);
      updateNodeConnections(parentName, nodes);

      tempLinks.push({
        temp_key: source + "" + target + "" + label,
        source: source,
        target: target,
        value: 1,
        label: label
      });
    }
  });

  var uniqueLinks = d3.nest()
    .key(function (d) {
      return d.temp_key;
    })
    .rollup(function (v) {
      return {source: v[0].source, target: v[0].target, value: v.length, label: v[0].label};
    })
    .entries(tempLinks);

  return uniqueLinks.map(d => d.value).filter(d => d.source !== d.target);
}

$(document).ready(function () {
  d3.json('data/alldata.json', function (err, rawData) {
    const data = preprocessData(rawData);
    createChart(data);
    createFilter(data);
  });
});

function preprocessData(rawData) {
  var uniqueData = [];
  rawData.forEach(function (d) {
    var item = uniqueData.find(e => e.id === d.id);
    if (!item) {
      d.topic = [d.topic];
      uniqueData.push(d);
    } else {
      item.topic.push(d.topic);
    }
  });

  return uniqueData.filter(d => d.by);
}
