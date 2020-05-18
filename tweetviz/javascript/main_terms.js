let mainsvg = d3.select("#mainsvg"),
    svgWidth = window.innerWidth * 3,
    svgHeight = window.innerHeight,
    axisHeight = 40,
    margin = {top: 40, right: 40, bottom: 40, left: 80, axisx: 40, axisy: 20, storyTop: 40},
    width = svgWidth - margin.left - margin.right - margin.axisx,
    height = svgHeight - margin.top - margin.storyTop - margin.axisx - margin.bottom,
    wordStreamHeight = 800,
    wordStreamWidth = width,
    scaleX = d3.scaleLinear().rangeRound([0, width]),
    mainGroup = null;//used to store main group as a global variable later on

mainsvg.attr("width", svgWidth).attr("height", svgHeight);

// let fileName = "tweets20200402";
// let timeFormatStr = "%H:%M %p";

// let fileName = "tweets202004051114";
// let timeFormatStr = "%a, %H%p";

let fileName = "trigrams_data";
let timeFormatStr = "%Y-%m-%d, %H";
let timeParse = d3.timeParse(timeFormatStr);

function outputFormat(date) {
    return d3.timeFormat(timeFormatStr)(date);
}


// loadData(fileName);

loadDataAll();

function loadDataAll() {
    //Just make sure that we clean the svg.
    mainsvg.selectAll("*").remove();
    //The maingroup
    mainGroup = mainsvg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    d3.json('data/terms_fc_data.json').then(termsData => {
        termsData = termsData.sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });
        console.log(termsData);
        let newTermsData = termsData
            .map(function (d) {
                let newD = d;
                newD.words.tweet = d.words.tweet.splice(0, 1000);
                return newD;
            })
        // draw(rawData, false);

        // mainGroup = mainsvg.append("g").attr("transform", `translate(${margin.left}, ${svgHeight / 3})`);

        d3.json('data/bigrams_fc_data.json').then(bigramsData => {
            bigramsData = bigramsData.sort((a, b) => {
                return new Date(a.date) - new Date(b.date);
            });
            console.log(bigramsData);
            let newBigramsData = bigramsData
                .map(function (d) {
                    let newD = d;
                    newD.words.tweet = d.words.tweet.splice(0, 1000);
                    return newD;
                });
            // draw(rawData, false);

            // mainGroup = mainsvg.append("g").attr("transform", `translate(${margin.left}, ${svgHeight * 2 / 3})`);

            d3.json('data/trigrams_fc_data.json').then(trigramsData => {
                trigramsData = trigramsData.sort((a, b) => {
                    return new Date(a.date) - new Date(b.date);
                });
                console.log(trigramsData);
                let newTrigramsData = trigramsData
                    .map(function (d) {
                        let newD = d;
                        newD.words.tweet = d.words.tweet.splice(0, 1000);
                        return newD;
                    })
                let data = [];
                newTermsData.forEach(function (term, idx) {
                    if (idx > 500) {
                        return;
                    }
                    let newElem = {
                        date: term.date,
                        words: {
                            term: term.words.tweet,
                            bigram: newBigramsData[idx].words.tweet,
                            trigram: newTrigramsData[idx].words.tweet
                        }
                    };
                    data.push(newElem);
                });
                console.log(data);
                draw(data, true);
            });
        });
    });
}

function loadData(fileName) {
    //Just make sure that we clean the svg.
    mainsvg.selectAll("*").remove();
    //The maingroup
    mainGroup = mainsvg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    d3.json('data/' + fileName + '.json').then(rawData => {
        rawData = rawData.sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });
        console.log(rawData);
        draw(rawData);
    });
}
