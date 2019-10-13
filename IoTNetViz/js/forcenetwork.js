function createForce(data) {
  let simulation = null,
    thicknessScale = null,
    radiusScale = null;
  let isFocus = false;
  let forceStrength = 0.15;
  let center = {x: width / 2, y: height / 2};
  const tooltip = floatingTooltip("chart-tooltip", 100);

  var forceSvg = mainSvg.append("svg")
    .attr("class", "network")
    .attr("width", width)
    .attr("height", height);

  initialization();
  createNetwork();



  function updateDraw() {

    let link = forceSvg.select(".links")
      .selectAll("g")
      .data(links, function (d) {
        return d.source.key + "" + d.target.key;
      })
      .attr("transform", `translate(${center.x}, ${center.y})`)
      .attr("stroke", d => color(d.label));

    link.select("line")
      .attr("fill", d => color(d.label))
      .attr("stroke-width", function (d) {
        return thicknessScale(d.value)
      });

    link.exit().remove();

    link.enter()
      .append("g")
      .attr("transform", `translate(${center.x}, ${center.y})`)
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
      .attr("cx", center.x)
      .attr("cy", center.y)
      .attr("r", function (d) {
        return radiusScale(d.values.length);
      })
      .attr("fill", function (d) {
        // if (d.isAlone) {
        //   return "#636363";
        // }
        return "#b8b8b8";
      });

    node.exit().remove();

    node.enter()
      .append("g")
      .attr("id", d => d.key)
      .append("circle")
      .attr("cx", center.x)
      .attr("cy", center.y)
      .attr("r", function (d) {
        return radiusScale(d.values.length);
      })
      .attr("fill", function (d) {
        // if (d.isAlone) {
        //   return "#636363";
        // }
        return "#b8b8b8";
      })
      .call(drag(simulation))
      .on('mouseover', showDetail)
      .on('mouseout', hideDetail)
      .on('click', d => setFocus(d));

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

  function updateNetwork(data) {
    removeFocus(forceSvg);

    let data_old = forceSvg.select('.nodes').selectAll('g').data();

    // let stories = data.filter(d => d.type === "story");
    // loadNewsData(stories, draw);

    // console.log(nodes);
    // console.log(links);

    nodes.forEach(d => {
      let temp = data_old.find(e => e.key === d.key);
      if (temp) {
        d.x = temp.x;
        d.y = temp.y;
      }
    });

    simulation.nodes(nodes)
      .force("link", d3.forceLink(links).id(d => d.key).distance(d => d.value).strength(0.2));

    const {link, node} = updateDraw();

    simulation.on("tick", function () {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      // link.attr("d", function (d) {
      //
      // })

      node
        .attr("transform", function (d) {
          return `translate(${d.x}, ${d.y})`;
        });

      if (simulation.alpha() <= 0.03) {
        simulation.stop()
      }
    });
  }

  function createNetwork() {
    var max = -1;

    // console.log(nodes);

    nodes.forEach(function (d) {
      if (d.values.length > max) {
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
      .force('charge', d3.forceManyBody().strength(-10))
      .force('collision', d3.forceCollide().radius(function (d) {
        return radiusScale(d.values.length + 5);
      })
        .iterations(20))
      .force('x', d3.forceX().strength(forceStrength / 2).x(0))
      .force('y', d3.forceY().strength(forceStrength).y(0))
      .velocityDecay(0.2)
      .alphaTarget(0.4);

    updateNetwork(data)
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

}

drag = simulation => {

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0.05);
    d.fx = null;
    d.fy = null;
  }

  return d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
};
