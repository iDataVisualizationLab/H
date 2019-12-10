let simulation = null,
  thicknessScale = null,
  radiusScale = null;
let isFocus = false;
let forceStrength = 0.1;
const tooltip = floatingTooltip("chart-tooltip", 100);
let clustersPosition = null;
let forceSvg = null;

function createForce(centers) {

  forceSvg = mainSvg.append("svg")
    .attr("class", "network")
    .attr("width", width)
    .attr("height", 800);

  clustersPosition = centers;

  createNodeTopics();
  initialization();
  createNetwork();

}

function updateDraw() {

  let link = forceSvg.select(".links")
    .selectAll("g")
    .data(links, function (d) {
      return d.source.key + "" + d.target.key;
    })
    // .attr("transform", `translate(${center.x}, ${center.y})`)
    .attr("stroke", /*d => color(d.label)*/ "#828282");

  link.select("line")
    .attr("fill", /*d => color(d.label)*/ "#828282")
    .attr("stroke-width", function (d) {
      return thicknessScale(d.value)
    });

  link.exit().remove();

  link.enter()
    .append("g")
    // .attr("transform", `translate(${center.x}, ${center.y})`)
    .attr("stroke", /*d => color(d.label)*/ "#828282")
    .attr("id", d => d.source.key + d.target.key)
    .append("line")
    .attr("fill", /*d => color(d.label)*/ "#828282")
    .attr("stroke-width", function (d) {
      return thicknessScale(d.value)
    });

  nodes = nodes.map(function (d) {
    d.pieData = {pie: d.pie, radius: d.values.length};
    return d;
  });

  let node = forceSvg.select(".nodes")
    .selectAll("g")
    .data(nodes, d => d.key);

  node.exit().remove();

  node.enter()
    .append("g")
    .attr("id", d => d.key)
    .call(drag(simulation))
    .on('mouseover', showDetail)
    .on('mouseout', hideDetail);

  node = forceSvg.select(".nodes")
    .selectAll("g");

  let pies = node.selectAll("path")
    .data(function (d) {
      return d.pieData.pie;
    })
    .attr('d', d3.arc()
      .innerRadius(0)
      .outerRadius(function (d) {
        parent = d3.select(this.parentNode).datum();
        return radiusScale(parent.values.length);
      })
    )
    .attr('fill', function (d) {
      return color(d.data.key)
    });

  pies.exit().remove();

  pies
    .enter()
    .append('path')
    .attr('d', d3.arc()
      .innerRadius(0)
      .outerRadius(function (d) {
        parent = d3.select(this.parentNode).datum();
        return radiusScale(parent.values.length);
      })
    )
    .attr('fill', function (d) {
      return color(d.data.key)
    })
    .attr("stroke", "white")
    .attr("stroke-width", d => d.data.value ? 0.5 : 0)
    .style("stroke-opacity", 0.6);


  link = forceSvg.select(".links")
    .selectAll("g").select("line");

  return {link, node};
}

function setFocus(d) {
  d3.event.stopPropagation();

  if (isFocus) {
    return;
  }

  const node = forceSvg.select(".nodes");
  const link = forceSvg.select(".links");
  d3.select(this.parentNode).style("opacity", 1);

  const {adjNodes, connectedLinks} = findAdjNodes(d);

  node.selectAll('g')
    .style("opacity", function (d) {
      if (adjNodes.includes(d.key)) {
        return 1;
      }
      return 0.1;
    })
    .select("circle")
    .on("mouseover", null)
    .on("mouseout", null);

  link.selectAll('g').style("opacity", function (d) {
    if (connectedLinks.includes(d.source.key + d.target.key)) {
      return 1;
    }
    return 0.1;
  });

  isFocus = true;

  simulation.stop()
}

function removeFocus() {
  forceSvg.select(".nodes").selectAll("g").style("opacity", 1)
    .select("circle")
    .on("mouseover", showDetail)
    .on("mouseout", hideDetail);
  forceSvg.select(".links").selectAll("g").style("opacity", 1);

  isFocus = false;

  simulation.restart()
}

function findAdjNodes(d) {
  var adjNodes = [d.key];
  var connectedLinks = [];

  nodes.forEach(function (node) {
    links.find(function (link) {

      if ((link.source.key === node.key && link.target.key === d.key) || (link.target.key === node.key && link.source.key === d.key)) {
        adjNodes.push(node.key);
        connectedLinks.push(node.key + d.key);
        connectedLinks.push(d.key + node.key);
        return true;
      }

      return false;
    });
  });

  return {adjNodes, connectedLinks};
}

function initialization() {
  forceSvg.append("g")
    .attr("class", "links")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.8);

  forceSvg.append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .attr("class", "nodes");

  var legends = forceSvg
    .append('g')
    .attr("stroke", "#999")
    .attr("class", "legend")
    .attr("transform", "translate(0, 100)");

  legends.append("circle")
    .attr("stroke", color("iot"))
    .attr("fill", color("iot"))
    .attr('r', 10)
    .attr("cx", 20)
    .attr("cy", 0)
    .attr("stroke-width", 2);

  legends.append('text')
    .text("Internet of Things")
    .attr("x", 40)
    .attr("y", 5);

  legends.append("circle")
    .attr("stroke", color("bigdata"))
    .attr("fill", color("bigdata"))
    .attr('r', 10)
    .attr("cx", 20)
    .attr("cy", 40)
    .attr("stroke-width", 2);

  legends.append('text')
    .text("Big Data")
    .attr("x", 40)
    .attr("y", 45);

  legends.append("circle")
    .attr("stroke", color("security"))
    .attr("fill", color("security"))
    .attr('r', 10)
    .attr("cx", 20)
    .attr("cy", 80)
    .attr("stroke-width", 2);

  legends.append('text')
    .text("Cybersecurity")
    .attr("x", 40)
    .attr("y", 85);
}

function createFakeNodes() {
  createNodeStat();

  nodes.push({key: "FakeIoTNode", values: [], isFake: true, cluster: "IoT", pie: {iot: 0, bigdata: 0, security: 0}});
  nodes.push({
    key: "FakeBigdataNode",
    values: [],
    isFake: true,
    cluster: "Big Data",
    pie: {iot: 0, bigdata: 0, security: 0}
  });
  nodes.push({
    key: "FakeSecurityNode",
    values: [],
    isFake: true,
    cluster: "Security",
    pie: {iot: 0, bigdata: 0, security: 0}
  });


  nodes.forEach(function (d) {
    if (d.topics && d.topics.includes("iot")) {
      links.push({source: "FakeIoTNode", target: d.key, value: 0, label: "none", isFake: true, stat: d.stat})
    }
    if (d.topics && d.topics.includes("bigdata")) {
      links.push({source: "FakeBigdataNode", target: d.key, value: 0, label: "none", isFake: true, stat: d.stat})
    }
    if (d.topics && d.topics.includes("security")) {
      links.push({source: "FakeSecurityNode", target: d.key, value: 0, label: "none", isFake: true, stat: d.stat})
    }
  });
}

function createNodeStat() {
  nodes.forEach(function (node) {
    if (!node.stat) {
      node['stat'] = {iot: 0, bigdata: 0, security: 0};
    } else {
      node.stat.iot = 0;
      node.stat.bigdata = 0;
      node.stat.security = 0;
    }
    node.values.forEach(function (post) {
      post.topic.forEach(function (t) {
        if (t === "iot") {
          node.stat.iot += 1;
        } else if (t === "bigdata") {
          node.stat.bigdata += 1;
        } else {
          node.stat.security += 1;
        }
      })
    });

    var pie = d3.pie()
      .value(function (d) {
        return d.value;
      });

    node['pie'] = pie(d3.entries(node.stat));
  })
}

function updateNetwork(centers) {
  // removeFocus(forceSvg);
  if (centers) {
    clustersPosition = centers;
  }

  createNodeTopics();
  createFakeNodes();

  let data_old = forceSvg.select('.nodes').selectAll('g').data();

  nodes.forEach(d => {
    let temp = data_old.find(e => e.key === d.key);
    if (temp) {
      d.x = temp.x;
      d.y = temp.y;
      d.vx = temp.vx;
      d.vy = temp.vy;
    }
  });

  simulation.nodes(nodes)
    .force("link", d3.forceLink(links).id(d => d.key).strength(function (d) {
      if (d.isFake && links.includes(d)) {
        var weight = 0.1;
        var sum = d.stat.iot + d.stat.bigdata + d.stat.security;
        // console.log(d, sum);
        if (d.source.key === "FakeIoTNode") {
          // console.log("IoT", weight * d.stat.iot / sum);
          return weight * d.stat.iot / sum;
        } else if (d.source.key === "FakeBigdataNode") {
          // console.log("Big Data", weight * d.stat.bigdata / sum);
          return weight * d.stat.bigdata / sum;
        } else {
          // console.log("Security", d.stat.security / sum);
          return weight * d.stat.security / sum;
        }
      }
      return 0;
    }));

  const {link, node} = updateDraw();

  simulation
    .on("tick", function () {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)
        .attr("visibility", function (d) {
          if (d.isFake) {
            return "hidden";
          }
          return "show";
        });

      node
        .attr("transform", function (d) {
          return `translate(${d.x}, ${d.y})`;
        })
        .attr("visibility", function (d) {
          if (d.isFake) {
            return "hidden"
          }
          return "show";
        });

      if (simulation.alpha() <= 0.11) {
        simulation.stop()
      }
    });

  simulation.alpha(1).alphaTarget(0.1).restart();
}

function createNetwork() {
  var max = -1;

  // console.log(nodes);

  nodes.forEach(function (d) {
    if (d.values && d.values.length > max) {
      max = d.values.length;
    }
  });

  radiusScale = d3.scaleSqrt()
    .range([3, 20])
    .domain([1, max]);

  var maxThickness = -1;
  links.forEach(function (d) {
    if (d.value > maxThickness) {
      maxThickness = d.value;
    }
  });

  thicknessScale = d3.scaleSqrt()
    .range([1, 5])
    .domain([1, maxThickness]);

  simulation = d3.forceSimulation()
    .force('charge', d3.forceManyBody().strength(-10).distanceMin(1).distanceMax(150))
    .force('collision', d3.forceCollide().radius(function (d) {
      return radiusScale(d.values.length+1);
    }))
    .force('x', d3.forceX().strength(function (d) {
      if (d.isFake) {
        return 1
      }
      return 0.3 //0.005
    }).x(d => {
      return getCluster(d).x
    }))
    .force('y', d3.forceY().strength(function (d) {
      if (d.isFake) {
        return 1
      }
      return 0.3 //0.005
    }).y(d => getCluster(d).y))
    .velocityDecay(0.2)
    .alphaTarget(0.1);

  updateNetwork()
}


function charge(d) {
  return -Math.pow(d.radius, 2.0) * forceStrength;
}

function showDetail(d) {
  d3.select(this).attr("stroke", "black");

  var connections = 0;
  if (d.connections) {
    connections = d.connections;
  }

  var content =
    '<span class="name">Author: </span><span class="value">' +
    d.key +
    '</span><br/>' +
    '<span class="name">Posts: </span><span class="value">' +
    d.values.length +
    '</span><br/>' +
    '<span class="name">Interactions: </span><span class="value">' +
    connections;

  tooltip.showTooltip(content, d3.event);
}

function hideDetail() {
  d3.select(this)
    .attr('stroke', function () {
      return "#ffffff";
    });

  tooltip.hideTooltip();
}

function createNodeTopics() {

  nodes.forEach(function (node) {
    node['topics'] = [];
    node.values.forEach(function (val) {
      val.topic.forEach(function (t) {
        if (!node.topics.includes(t)) {
          node.topics.push(t)
        }
      })
    });
    node.topics = _.uniq(_.flatten(node.topics));
  })
}

function getCluster(node) {
  if (node.isFake) {
    return clustersPosition.find(d => d.name === node.cluster);
  }

  var text = "";

  if (node.topics.includes("iot")) {
    text += "IoT "
  }
  if (node.topics.includes("bigdata")) {
    text += "Big Data "
  }
  if (node.topics.includes("security")) {
    text += "Security"
  }

  text = text.trim();

  console.log(node);
  console.log(text);

  var cluster = clustersPosition.find(function (d) {
    return d.name === text;
  });

  return {
    x: cluster.x + Math.floor(Math.random() * Math.floor(50)),
    y: cluster.y + Math.floor(Math.random() * Math.floor(50))
  }
}

drag = simulation => {

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.5).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0.1);
    d.fx = null;
    d.fy = null;
  }

  return d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
};
