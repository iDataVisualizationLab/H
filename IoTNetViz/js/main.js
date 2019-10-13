let width = 1600,
  height = 1000;

let center = {x: width / 2, y: height / 2};
let vennCenters = null;
let color = d3.scaleOrdinal(d3.schemeCategory20);

let mainSvg = d3.select("#main-chart");

let nodes = null;
let idToUsername = null;
let links = null;
let userName = null;

let chart = function createChart(data) {
  mainSvg.selectAll("*").remove();

  mainSvg.attr("width", width)
    .attr("height", height);

  nodes = createNodes(data);
  userName = nodes.map(d => d.key);
  idToUsername = idToUsernameMap();
  links = createLinks(data);

  console.log(nodes);

  vennCenters = createVenn(data);
  console.log(vennCenters)
  // createForce(data);


};

function idToUsernameMap() {
  var map = {};
  nodes.forEach(function (d) {
    d.values.forEach(function (v) {
      map[v.id] = d.key;
    })
  });

  return map;
}

function createNodes(data) {
  const temp = d3.nest().key(d => d.by).entries(data);
  return temp.filter(function (d) {
    return d.values.length > 5;
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

    if (!userName.includes(name) || !userName.includes(parentName)){
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
    chart(data);
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
