let cloudColor = d3.scaleOrdinal(d3.schemeCategory20);
let cloud = null;
let kwData = null;

function wordCloudPreprocess() {
  cloudSvg.attr("width", width)
    .attr("height", height);

  d3.csv("data/time_arc.csv", function (err, filteredWords) {
    console.log(new Date(filteredWords[0].time).getTime());

    let filteredData = [];

    filteredWords.forEach(function (d) {
      var tempText = "";
      d.keywords.split("|").forEach(function (kw) {
        tempText += kw+" ";
      });
      filteredData.push({
        time: d.time,
        title: tempText
      })
    });

    console.log(filteredData);

    loadNewsData(filteredData, drawWordStream);
  })
}

function createWordCloud() {
  cloudSvg.attr("width", 1600)
    .attr("height", 300)
    .append("g")
    .attr("transform", "translate(800, 150)");

  cloud = d3.layout.cloud().size([1600, 300])
    .padding(5)
    .font("Impact");
}

function updateCloud(words) {

  function draw(words) {
    let text = cloudSvg.select('g')
      .selectAll("text")
      .data(words, function (d) {
        return d.text;
      });


    text
      .style("font-size", function (d) {
        return d.osize + "px";
      })
      .attr("transform", function (d) {
        return `translate(${d.ox}, ${d.oy}) rotate(${d.orotate})`;
      })
      .transition()
      .duration(600)
      .style("font-size", function (d) {
        return d.size + "px";
      })
      .attr("transform", function (d) {
        return `translate(${d.x}, ${d.y}) rotate(${d.rotate})`;
      });

    text.exit()
      .transition()
      .duration(200)
      .style('fill-opacity', 1e-6)
      .attr('font-size', 1)
      .remove();

    text.enter()
      .append("text")
      .style("font-family", "Impact")
      .style("fill", function (d, i) {
        return cloudColor(i);
      })
      .attr("text-anchor", "middle")
      .attr('font-size', 1)
      .text(function (d) {
        return d.text;
      })
      .transition()
      .duration(600)
      .style("font-size", function (d) {
        return d.size + "px";
      })
      .attr("transform", function (d) {
        return `translate(${d.x}, ${d.y}) rotate(${d.rotate})`;
      })
      .style("fill-opacity", 1);


  }

  let data_old = cloudSvg.select('g').selectAll('text').data();

  words.forEach(d => {
    let temp = data_old.find(e => e.text === d.text);
    if (temp) {
      d.ox = temp.x;
      d.oy = temp.y;
      d.osize = temp.size;
      d.orotate = temp.rotate;
    }
  });

  cloud
    .words(words)
    .rotate(function () {
      return 0;
    })
    .fontSize(function (d) {
      return d.size;
    })
    .on("end", draw)
    .start()
}

function getWords(i) {
  return docs[i]
    .replace(/[!\.,:;\?#&%$@\*\(\)]/g, '')
    .split(' ')
    .map(function (d) {
      return {text: d, size: 20};
    })
}

function showNewWords(i) {
  i = i || 0;

  updateCloud(getWords(i++ % docs.length));
  setTimeout(function () {
    showNewWords(i + 1)
  }, 3000);
}


