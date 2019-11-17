function createWordStream() {
  cloudSvg.attr("width", width)
    .attr("height", height);

  d3.csv("data/time_arc.csv", function (err, filteredWords) {

    let filteredData = [];

    filteredWords.forEach(function (d) {
      var tempText = "";
      d.keywords.split("|").forEach(function (kw) {
        tempText += kw + " ";
      });
      filteredData.push({
        time: d.time,
        title: tempText
      })
    });

    loadNewsData(filteredData, drawWordStream);
  })
}

let wordStreamConfig = {
  topWord: 100,
  minFont: 10,
  maxFont: 30,
  tickFont: 12,
  legendFont: 12,
  curve: d3.curveMonotoneX
};

let yearSvgWidth = 0;

function createWordStreamV2(wordStreamData) {
  // yearSvgWidth = width / 12;
  yearSvgWidth = 122;

  cloudSvg.attr("width", yearSvgWidth * 12)
    .attr("height", 400)
    .attr("transform", "translate(60,0)");

  let data = wordStreamData.sort(function (a, b) {
    var d1 = new Date(b.date).getTime();
    var d2 = new Date(a.date).getTime();
    return d2 - d1;
  });
  data = data.map(function (d) {
    return {
      date: d.date,
      words: {
        keyword: d.words.keyword
      }
    }
  });
  wordstream(cloudSvg, data, wordStreamConfig)
}

function updateWordStreamV2(wordStreamData) {
  cloudSvg.selectAll('g').remove();

  let data = wordStreamData.sort(function (a, b) {
    var d1 = new Date(b.date).getTime();
    var d2 = new Date(a.date).getTime();
    return d2 - d1;
  });
  data = data.map(function (d) {
    return {
      date: d.date,
      words: {
        keyword: d.words.keyword
      }
    }
  });
  let numOfDate = data.length;
  let timeRange = +data[0].date - 2007;
  console.log(timeRange);
  cloudSvg.attr("width", yearSvgWidth * numOfDate)
    .attr("transform", `translate(${timeRange * yearSvgWidth + 60},0)`);
  wordstream(cloudSvg, data, wordStreamConfig)
}
