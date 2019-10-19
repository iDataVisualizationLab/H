let svgWidth = 1600,
  svgHeight = 1000;

let margin = {top: 10, right: 10, bottom: 10, left: 10, axisx: 0, axisy: 60, storyTop: 40},
  width = svgWidth - margin.left - margin.right - margin.axisx,
  height = svgHeight - margin.top - margin.storyTop - margin.axisx - margin.bottom;

let center = {x: width / 2, y: height / 2};
let vennCenters = null;
let color = d3.scaleOrdinal(d3.schemeCategory10);

let mainSvg = d3.select("#main-chart");
let filterSvg = d3.select('#filter-svg');
let cloudSvg = d3.select('#cloud-svg');

let nodes = null;
let idToUsername = null;
let links = null;
let userName = null;
let toggle = true;


let docs = [
  "You don't know about me without you have read a book called The Adventures of Tom Sawyer but that ain't no matter.",
  "The boy with fair hair lowered himself down the last few feet of rock and began to pick his way toward the lagoon.",
  "When Mr. Bilbo Baggins of Bag End announced that he would shortly be celebrating his eleventy-first birthday with a party of special magnificence, there was much talk and excitement in Hobbiton.",
  "It was inevitable: the scent of bitter almonds always reminded him of the fate of unrequited love."
];

function createCloud() {
  createWordCloud();
  showNewWords();
}

function wsTimeFilter(wordStreamData, values) {
  return wordStreamData.filter(function (d) {
    var time = new Date(d.date);
    var left = values[0];
    var right = new Date(values[1]).getTime() + 365 * 24 * 60 * 60 * 1000;
    if (time >= values[0] && time <= right) {
      return true;
    }
    return false;
  })
}

function createFilter(rawData, wordStreamData) {
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
    .attr("transform", `translate(82.5, 10)`);

  var slider = d3.sliderHorizontal()
    .min(new Date(minTime.getFullYear(), 0, 0))
    .max(new Date(maxTime.getFullYear() + 1, 0, 1))
    .step(365 * 24 * 60 * 60 * 1000)
    .default([new Date(maxTime.getFullYear() + 1, 0, 0), new Date(minTime.getFullYear(), 0, 0)])
    .fill('#2196f3')
    .tickFormat(d3.timeFormat('%Y'))
    .width(width - 82.5 * 2)
    .on('end', values => {
      var newData = timeFilter(rawData, values);
      updateData(newData);
      updateNetwork(mainSvg);

      var newWSData = wsTimeFilter(wordStreamData, values)
      updateWordStreamV2(newWSData);
    });

  sliderContainer.call(slider);


  var toggles = filters.append('g')
    .attr("class", "toggles")
    .attr("stroke", "#999")
    .attr("transform", `translate(${margin.left},70)`);


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
    .attr("height", 800);

  filterSvg.attr("width", width)
    .attr("height", 100);

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
    return d.values.length >= 10;
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

function createStream(wordStreamData) {
  createWordStreamV2(wordStreamData);
}

$(document).ready(function () {
  d3.json('data/alldata.json', function (err, rawData) {
    const data = preprocessData(rawData);
    createChart(data);
    d3.json("data/word_stream_data.json", function (err, wordStreamData) {
      // createCloud();
      createStream(wordStreamData);
      createFilter(data, wordStreamData);
    });
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
