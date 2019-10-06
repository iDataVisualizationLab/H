let authorWords = null;
let wordAuthors = null;

function loadNewsData(rawData, draw) {
    //Reset the variables
    authorWords = {};
    wordAuthors = {};
    //<editor-fold desc="process stopwords">
    let stopWords = ["a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"];
    let removeWords = ["iot", "internet", "things", "--", "can", "will", "new", "hn", "data", "ask", "pdf", "10", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020",
        "os", "secure", "world", "ages", "age", "open", "source", "free", "make", "device", "devices", "apply", "platform", "platforms", "future", "development", "developing", "middle", "building", "build", "back", "need", "needs", "us", "looking", "turn", "industrial", "industry",
        "whats", "chief", "fear", "people", "real", "change", "sending", "send", "trends", "trend", "show", "application", "solution", "solutions", "software", "engine", "guide", "technology", "big"];
    let removePhrases = [];
    if(fileName.indexOf('bigdata')>=0){
        removePhrases = ["big data", "bigdata"];
    }
    if(fileName.indexOf('iot')>=0){
        removePhrases = ["internet of things", "iot"];
    }
    if(fileName.indexOf('cps')){
        removePhrases = ["cyber-physical system", "cyber physical system", "cps"]
    }
    let phrases = [];
    stopWords = stopWords.concat(removeWords);

    function sanitizeWord(word) {
        word = word.replace('"', '')
            .replace("?", '')
            .replace("\.", '')
            .replace(",", '')
            .replace(":", '')
            .replace("'", '')
            .replace("\[", '')
            .replace("\]", '')
            .replace("\(", '')
            .replace("\)", '')
            .replace("‘", '')
            .replace("“", '')
            .replace("”", '')
            .replace("-$", '')
            .replace("\$", "USD")
            .replace("'", '')
            .replace("’", '')
            .replace(".", '')
            .replace("#", '')
            .replace("/", '')
            .replace("+", '')
            .replace(";", '')
            .replace("&", 'and')
            .replace("=", '')
            .replace("**", '');


        return word;
    }

    function removeStopWords(words, stopWords) {
        let result = [];
        words.forEach(w => {
            if (stopWords.indexOf(w.toLowerCase()) < 0) {
                result.push(w);
            }
        });
        let result1 = [];
        result.forEach(d => {
            if (d.length >= 3) {
                result1.push(d);
            }
        });
        result = result1;
        return result;
    }

    //</editor-fold>

    let outputFormat = function (date) {
        return d3.timeFormat('%Y')(date) + "Q" + getQuarter(date);
    }

    function getQuarter(date) {
        try {
            var month = date.getMonth() + 1;
        } catch (error) {
            console.log(date);
            debugger
        }

        return (Math.ceil(month / 3));
    }

    let data = {};
    let topic = "IoT";
    rawData.forEach(d => {
        let date = new Date(d.timestamp);
        date = outputFormat(date);
        if (!data[date]) data[date] = {};
        let author = d.by;

        //Reserve the phrase
        String.prototype.replaceAt=function(index, replacement) {
            return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
        }
        phrases.forEach((p, i) => {
            let startIdx = -1;
            do {
                startIdx = d.title.toLowerCase().indexOf(p.toLowerCase())
                if (startIdx >= 0) {
                    for (let j = 0; j < p.length; j++) {
                        d.title = d.title.replaceAt((startIdx + j), p[j]);//convert to the phrase careless of cases for each character
                    }
                    d.title = d.title.replace(p, 'myphrase' + i);//replace p
                }
            } while (startIdx >= 0);//keep doing this to make sure that we replace all phrases
        });
        //Remove the phrases
        //This is to make sure that we remove phrase both in upper or lower case

        removePhrases.forEach((p, i) => {
            let startIdx = -1;
            do {
                startIdx = d.title.toLowerCase().indexOf(p.toLowerCase());
                if (startIdx >= 0) {
                    for (let j = 0; j < p.length; j++) {
                        d.title = d.title.replaceAt(startIdx+j, p[j]);//convert to the phrase careless of cases for each character
                    }
                    d.title = d.title.replace(p, 'removephrase');//replace p to the removephrase
                }
            } while (startIdx >= 0);//Repeating this to make sure tha we replace all occurrences
        });
        d.title = d.title.replace('removephrase', '');//Now actually remove it.

        let words = d.title.split(' ');
        words = words.map(d => sanitizeWord((d)));
        //Put the phrase back
        phrases.forEach((p, i) => {
            words.forEach((w, j) => {
                if (w === "myphrase" + i) words[j] = p;
            });
        });

        words = removeStopWords(words, stopWords);
        words = words.filter(t => t != '');//remove empty words
        words.forEach(word => {
            let wordTime = word + date;
            if (!authorWords[author]) authorWords[author] = [];
            authorWords[author].push(wordTime);
            if (!wordAuthors[wordTime]) wordAuthors[wordTime] = [];
            wordAuthors[wordTime].push(author)
        });
        data[date][topic] = data[date][topic] ? (data[date][topic].concat(words)) : (words);
    });


    data = d3.keys(data).map(function (date) {
        let words = {};
        var raw = {};
        raw[topic] = data[date][topic];
        //Count word frequencies
        var counts = raw[topic].reduce(function (obj, word) {
            if (!obj[word]) {
                obj[word] = 0;
            }
            obj[word]++;
            return obj;
        }, {});
        //Convert to array of objects
        words[topic] = d3.keys(counts).map(function (d) {
            return {
                text: d,
                frequency: counts[d],
                topic: topic
            }
        }).sort(function (a, b) {//sort the terms by frequency
            return b.frequency - a.frequency;
        }).filter(function (d) {//filter out empty words
            return d.text;
        });
        // words[topic] = words[topic].slice(0, d3.min([words[topic].length, 60]));
        return {
            date: date,
            words: words
        }
    }).sort(function (a, b) {//sort by date
        return a.date.localeCompare(b.date);
    });
    draw(data);
}

