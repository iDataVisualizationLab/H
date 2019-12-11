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
    let minYear = +data[0].date;
    let maxYear = +data[data.length - 1].date;

    console.log(minYear, maxYear);
    timeSlider.value([new Date(minYear-1, 11, 31).getTime(), new Date(maxYear, 11, 31).getTime()]);

    let trackFill = d3.select('.track-fill');
    let translateX = +trackFill.attr('x1') + 60;
    console.log(translateX);
    cloudSvg.attr("width", trackFill.attr('x2') - trackFill.attr('x1') + 45)
        .attr("transform", `translate(${translateX},0)`);
    wordstream(cloudSvg, data, wordStreamConfig)
}
