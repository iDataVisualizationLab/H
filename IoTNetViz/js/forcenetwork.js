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
    .attr("height", height);

  clustersPosition = centers;

  createNodeTopics();

  // var d3cola = cola.d3adaptor(d3).size([width, height]);
  // testCola(d3cola, forceSvg);

  initialization();
  createNetwork();

}

// function mapNameToIndex() {
//   var nameToIndex = {};
//   nodes.forEach(function (d, i) {
//     nameToIndex[d.key] = i;
//   });
//
//   links.forEach(function (d) {
//     d.source = nameToIndex[d.source];
//     d.target = nameToIndex[d.target];
//   });
// }

// function filterAloneNodes(nodes, links) {
//   nodes.forEach(function (node) {
//     node.isAlone = true;
//     var existNode = links.find(function (d) {
//       return (node.key === d.source || node.key === d.target);
//     });
//
//     if (!existNode) {
//       node.isAlone = false;
//     }
//   })
// }

// function testCola(d3cola, svg) {
//
//   filterAloneNodes(nodes, links);
//
//   nodes = nodes.filter(d => d.isAlone);
//
//   mapNameToIndex();
//
//   var groupMap = {};
//   nodes.forEach(function (v, i) {
//     var g = v.topics;
//     var groupId = "";
//
//     if (g.length === 3) {
//       groupId = "iot bigdata security";
//     } else if (g.length === 1) {
//       groupId = g[0];
//     } else {
//       if (g.includes("iot") && g.includes("bigdata")) {
//         groupId = "iot bigdata"
//       } else if (g.includes("iot") && g.includes("security")) {
//         groupId = "iot security"
//       } else {
//         groupId = "bigdata security"
//       }
//     }
//
//     v.group = groupId;
//
//     if (!groupMap[groupId]) {
//       groupMap[groupId] = []
//     } else {
//       groupMap[groupId].push(i);
//     }
//
//     v.width = v.height = 10;
//   });
//
//   var groups = [];
//   for (var g in groupMap) {
//     groups.push({id: g, leaves: groupMap[g]});
//   }
//
//   d3cola.nodes(nodes)
//     .links(links)
//     .groups(groups)
//     .jaccardLinkLengths(40, 0.7)
//     .avoidOverlaps(true)
//     .start(20, 0, 10);
//
//   var group = svg.selectAll('.group')
//     .data(groups)
//     .enter().append('rect')
//     .classed('group', true)
//     .attr('rx', 5)
//     .attr('ry', 5)
//     .style("fill", function (d) {
//       return color(d.id);
//     })
//     .style("opacity", .5)
//     .call(d3cola.drag);
//
//   var link = svg.selectAll(".link")
//     .data(links)
//     .enter().append("line")
//     .attr("class", "link")
//     // .style("stroke", "#b8b8b8")
//     .style("stroke-width", function (d) {
//       return Math.sqrt(d.value);
//     });
//
//   var node = svg.selectAll(".node")
//     .data(nodes)
//     .enter().append("circle")
//     .attr("class", "node")
//     .attr("r", 5)
//     .style("fill", function (d) {
//       return color(d.group);
//     })
//     .call(d3cola.drag);
//
//   node.append("title")
//     .text(function (d) {
//       return d.name;
//     });
//
//   d3cola.on('tick', function () {
//     link.attr("x1", function (d) {
//       return d.source.x;
//     })
//       .attr("y1", function (d) {
//         return d.source.y;
//       })
//       .attr("x2", function (d) {
//         return d.target.x;
//       })
//       .attr("y2", function (d) {
//         return d.target.y;
//       });
//
//     node.attr("cx", function (d) {
//       return d.x;
//     })
//       .attr("cy", function (d) {
//         return d.y;
//       });
//
//     group
//       .attr('x', function (d) {
//         return d.bounds.x
//       })
//       .attr('y', function (d) {
//         return d.bounds.y
//       })
//       .attr('width', function (d) {
//         return d.bounds.width()
//       })
//       .attr('height', function (d) {
//         return d.bounds.height()
//       });
//   });
//
// }

function updateDraw() {

  let link = forceSvg.select(".links")
    .selectAll("g")
    .data(links, function (d) {
      return d.source.key + "" + d.target.key;
    })
    // .attr("transform", `translate(${center.x}, ${center.y})`)
    .attr("stroke", d => color(d.label));

  link.select("line")
    .attr("fill", d => color(d.label))
    .attr("stroke-width", function (d) {
      return thicknessScale(d.value)
    });

  link.exit().remove();

  link.enter()
    .append("g")
    // .attr("transform", `translate(${center.x}, ${center.y})`)
    .attr("stroke", d => color(d.label))
    .attr("id", d => d.source.key + d.target.key)
    .append("line")
    .attr("fill", d => color(d.label))
    .attr("stroke-width", function (d) {
      return thicknessScale(d.value)
    });

  let node = forceSvg.select(".nodes")
    .selectAll("g")
    .data(nodes, d => d.key);

  node.select("circle")
    .attr("r", function (d) {
      return radiusScale(d.values.length);
    })
    .attr("fill", function (d) {
      // if (d.isAlone) {
      //   return "#636363";
      // }
      return "#636363";
    });

  node.exit().remove();

  node.enter()
    .append("g")
    .attr("id", d => d.key)
    .append("circle")
    .attr("r", function (d) {
      return radiusScale(d.values.length);
    })
    .attr("fill", function (d) {
      // if (d.isAlone) {
      //   return "#636363";
      // }
      return "#636363";
    })
    .call(drag(simulation))
    .on('mouseover', showDetail)
    .on('mouseout', hideDetail)
    // .on('click', d => setFocus(d));

  node = forceSvg.select(".nodes")
    .selectAll("g");

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
}

function createFakeNodes() {
  createNodeStat();

  nodes.push({key: "FakeIoTNode", values: [], isFake: true, cluster: "IoT"});
  nodes.push({key: "FakeBigdataNode", values: [], isFake: true, cluster: "Big Data"});
  nodes.push({key: "FakeSecurityNode", values: [], isFake: true, cluster: "Security"});


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
    node['stat'] = {iot: 0, bigdata: 0, security: 0};
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
    })
  })
}

function updateNetwork() {
  removeFocus(forceSvg);
  createNodeTopics();
  createFakeNodes();

  let data_old = forceSvg.select('.nodes').selectAll('g').data();

  console.log(nodes);

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
      if (d.isFake) {
        var weight = 0.1;
        var sum = d.stat.iot + d.stat.bigdata + d.stat.security;
        console.log(d, sum);
        if (d.source.key === "FakeIoTNode") {
          console.log("IoT", weight * d.stat.iot / sum);
          return weight * d.stat.iot / sum;
        } else if (d.source.key === "FakeBigdataNode") {
          console.log("Big Data",weight * d.stat.bigdata / sum);
          return weight * d.stat.bigdata / sum;
        } else {
          console.log("Security", d.stat.security / sum);
          return weight * d.stat.security / sum;
        }
      }
      return 0.008;
    }));

  const {link, node} = updateDraw();

  simulation.on("tick", function () {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y)
      .attr("visibility", function (d) {
        if (d.isFake) {
          return "show";
        }
        return "hidden";
      });

    node
      .attr("transform", function (d) {
        return `translate(${d.x}, ${d.y})`;
      });

    if (simulation.alpha() <= 0.3000001) {
      simulation.stop()
    }
  });

  simulation.alphaTarget(0.3).restart();
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
    .force('charge', d3.forceManyBody().strength(-10).distanceMin(10).distanceMax(150))
    .force('collision', d3.forceCollide().radius(function (d) {
      return radiusScale(d.values.length + 5);
    }))
    .force('x', d3.forceX().strength(function (d) {
      if (d.isFake) {
        return 1
      }
      return 0.05
    }).x(d => {
      return getCluster(d).x
    }))
    .force('y', d3.forceY().strength(function (d) {
      if (d.isFake) {
        return 1
      }
      return 0.05
    }).y(d => getCluster(d).y))
    .alphaTarget(0.3);

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
    if (!d3.event.active) simulation.alphaTarget(0.5);
    d.fx = null;
    d.fy = null;
  }

  return d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
};
