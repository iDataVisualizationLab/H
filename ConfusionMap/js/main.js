function ConfusionMap(htmlContainer, confusionMapData, classes, confusionMapSettings) {
  let settings = {
    width: confusionMapSettings.width,
    height: confusionMapSettings.height,
    forceStrength: confusionMapSettings.forceStrength,
    bubbleRadius: confusionMapSettings.bubbleRadius,
    arcInnerRadius: confusionMapSettings.arcInnerRadius,
    arcOuterRadius: confusionMapSettings.arcOuterRadius
  };

  let center = {x: settings.width / 2, y: settings.height / 2};

  let container = d3.select(htmlContainer);
  let canvas = container.append('canvas')
    .attr('id', 'confusion-canvas')
    .attr("width", settings.width)
    .attr("height", settings.height);
  let context = canvas.node().getContext("2d");
  let color = d3.scaleOrdinal(d3.schemeCategory10);
  let svg = container.append('svg')
    .attr('id', 'confusion-svg')
    .attr('width', settings.width)
    .attr('height', settings.height);
  let clusters = {};
  let fakeNodes = {};

  let bubbles = null, simulation = null;

  ConfusionMap.prototype.draw = function () {
    drawArc();
    drawPieBubble();

    function drawPieBubble() {
      initialization();

      let nodes = createNodes();
      nodes = createFakeNodes(nodes);

      bubbles = svg.select('.nodes').selectAll(".node").data(nodes.filter(d => !d.isFake), d => d.index);

      bubbles.exit().remove();
      bubbles
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended));

      bubbles = svg.select('.nodes').selectAll('.node');

      let arc = d3.arc()
        .innerRadius(0)
        .outerRadius(settings.bubbleRadius);

      let pies = bubbles.selectAll('path')
        .data(d => d.pie)
        .attr('d', d => arc(d))
        .attr('fill', d => color(d.data.key));

      pies.exit().remove();

      pies
        .enter()
        .append('path')
        .attr('d', d => arc(d))
        .attr('fill', d => color(d.data.key))
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .style("stroke-opacity", 0.6);

      simulation = d3.forceSimulation()
        .force('x', d3.forceX().strength(d => d.isFake ? 1 : settings.forceStrength).x(d => d.isFake ? d.x : center.x))
        .force('y', d3.forceY().strength(d => d.isFake ? 1 : settings.forceStrength).y(d => d.isFake ? d.y : center.y))
        .force('charge', d3.forceManyBody().strength(d => d.isFake ? 0 : charge(d)))
        .force('collision', d3.forceCollide().radius(d => d.isFake ? 0 : settings.bubbleRadius * 2))
        .alphaTarget(0.1)
        .on('tick', ticked);

      svg.select('.legends')
        .selectAll('.class-legend')
        .data(d3.entries(clusters))
        .enter()
        .append('text')
        .attr('class', 'class-legend')
        .text(d => d.key)
        .attr('fill', d => color(d.key))
        .attr('transform', d => `translate(${d.value.x > center.x ? d.value.x + 10 : d.value.x - 5}, ${d.value.y + 10 > center.y ? d.value.y + 5 : d.value.y - 5}) rotate(-90)`);

      simulation.nodes(nodes);
      let links = createLinks(nodes);

      console.log(links);

      simulation.force("link", d3.forceLink(links).id(d => d.index).strength(d => d.value / 2));
    }

    function initialization() {
      svg.append("g")
        .attr("class", "links")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.8);

      svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .attr("class", "nodes");

      svg.append('g')
        .attr('class', 'legends');
    }

    function drawArc() {
      let chartArc = d3.arc()
        .outerRadius(settings.arcOuterRadius)
        .innerRadius(settings.arcInnerRadius)
        .padAngle(0.01)
        .context(context);

      let chartPie = d3.pie();
      let chartArcs = chartPie(classes.map(d => d.number));

      context.translate(settings.width / 2, settings.height / 2);

      chartArcs.forEach(function (d, i) {
        let clusterPoint = {};
        clusterPoint.angleOnArc = (d.startAngle + d.endAngle) / 2;
        clusterPoint.x = center.x + settings.arcOuterRadius * Math.cos(clusterPoint.angleOnArc - Math.PI / 2);
        clusterPoint.y = center.y + settings.arcOuterRadius * Math.sin(clusterPoint.angleOnArc - Math.PI / 2);
        context.beginPath();
        chartArc(d);
        context.fillStyle = color(classes[i].name);
        context.fill();

        clusters[classes[i].name] = clusterPoint;

        //temp drawing for test
        // svg.append('g')
        //   .append('rect')
        //   .attr('x', clusterPoint.x)
        //   .attr('y', clusterPoint.y)
        //   .attr('width', '5px')
        //   .attr('height', '5px');
      });

      context.beginPath();
      chartArcs.forEach(chartArc);
      context.lineWidth = 1.5;
    }

    function categoryClass(arr) {
      let max = arr[0];
      let maxIdx = 0;
      arr.forEach(function (d, i) {
        if (d >= max) {
          max = d;
          maxIdx = i;
        }
      });

      return classes.find(d => d.index === maxIdx).name
    }

    function binaryClass(arr) {
      let idx = arr[0] >= 0.5 ? 1 : 0;
      return classes.find(d => d.index === idx).name;
    }

    function findClass(arr) {
      if (arr.length === 1) {
        return binaryClass(arr);
      } else {
        categoryClass(arr);
      }
    }

    function binaryArrCalculator(d) {
      let result = {};
      result[classes[0].name] = 1 - d[0];
      result[classes[1].name] = d[0];
      return d3.entries(result);
    }

    function createLinks(nodes) {
      let links = [];

      nodes.filter(d => d.isFake).forEach(function (d) {
        clusters[d.class_name].index = d.index;
      });

      nodes.filter(d => !d.isFake).forEach(function (d) {
        d.pie.forEach(function (v) {
          let newLink = {};
          newLink.source = d.index;
          newLink.target = clusters[v.data.key].index;
          newLink.value = v.data.value;

          links.push(newLink);
        })
      });

      return links;
    }

    function createNodes() {
      let predicted = confusionMapData.predicted;
      return predicted.map(function (d, i) {
        let pie = d3.pie().value(function (d) {
          return d.value;
        });
        return {
          index: i,
          pie: pie(binaryArrCalculator(d)),
          class_name: findClass(d),
          x: Math.random() * 900,
          y: Math.random() * 900,
          isFake: false
        };
      });
    }

    function createFakeNodes(nodes) {
      for (let key in clusters) {
        let pie = d3.pie().value(function (d) {
          return d.value;
        });
        nodes.push({
          index: 0,
          pie: pie(binaryArrCalculator(key === 'ozone' ? [1] : [0])),
          class_name: key,
          x: clusters[key].x,
          y: clusters[key].y,
          isFake: true
        })
      }

      return nodes;
    }

    function ticked() {
      bubbles.attr("transform", d => `translate(${d.x},${d.y})`);

      if (simulation.alpha() <= 0.1001) {
        simulation.stop()
      }
    }

    function charge(d) {
      return -Math.pow(d.radius, 2.0) * settings.forceStrength;
    }

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(1).restart();
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
  }
}

let htmlContainer = document.getElementById('main');
let classes = [
  {name: 'non ozone', number: 42, index: 0},
  {name: 'ozone', number: 44, index: 1}
];

let confusionMapData = {};
confusionMapData.predicted = [[0.6577708], [0.42915076], [0.67946553], [0.7176305], [0.0353395], [0.63791525], [0.78685224], [0.08230406], [0.7602704], [0.68304753], [0.14824548], [0.7761138], [0.6084046], [0.8212285], [0.46098617], [0.5042223], [0.51158625], [0.6585492], [0.6867223], [0.64816785], [0.03317457], [0.65083617], [0.7141204], [0.816728], [0.81557333], [0.70946634], [0.70962924], [0.6819362], [0.75005233], [0.59389687], [0.34191465], [0.58785665], [0.29135382], [0.15907755], [0.71887803], [0.09843683], [0.67772424], [0.71884525], [0.6207421], [0.28317684], [0.73451376], [0.7753835], [0.3498064], [0.41407222], [0.4038518], [0.74512535], [0.3600725], [0.37871638], [0.68230706], [0.37482756], [0.34490275], [0.36609155], [0.57220155], [0.56482685], [0.26698658], [0.02368394], [0.6946526], [0.02224344], [0.72108454], [0.7149951], [0.41166496], [0.6237015], [0.5959014], [0.270209], [0.4460016], [0.76084375], [0.5135251], [0.5709525], [0.65649617], [0.68551797], [0.7107873], [0.7156175], [0.16144592], [0.75257605], [0.678505], [0.04419336], [0.58856833], [0.56649375], [0.01373163], [0.74719054], [0.594821], [0.7706681], [0.6424087], [0.75012887], [0.5791498], [0.32290894]];
confusionMapData.actual = [1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0];
let confusionMapSettings = {
  width: 500,
  height: 500,
  forceStrength: 0.04,
  bubbleRadius: 7,
  arcInnerRadius: 190,
  arcOuterRadius: 200
};
let map = new ConfusionMap(htmlContainer, confusionMapData, classes, confusionMapSettings);
map.draw();
