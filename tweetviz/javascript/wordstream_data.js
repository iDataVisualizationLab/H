let tweetWords = null;
let wordTweets = null;

function loadTweetsData(inputData, draw) {
    let rawData = inputData.rawData;
    if(typeof(rawData[0])==="string"){
        rawData = rawData.map(d=>JSON.parse(d));
    }

    let instagramData = inputData.instagramData;

    //Reset the variables
    tweetWords = {};
    wordTweets = {};
    //<editor-fold desc="process stopwords">
    let stopWords = ["a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"];
    let removeWords = ["https", "co", "link", "click"];
    let removePhrases = [];
    let phrases = ["New York"];
    stopWords = stopWords.concat(removeWords);
    //</editor-fold>
    let data = {};
    let tweetTopic = "tweet";
    let instagramTopic = "instagram";
    // let pictureTopic = "picture";
    //Utilities for remove and reserve phrases
    String.prototype.replaceAt = function (index, replacement) {
        return this.substr(0, index) + replacement + this.substr(index + replacement.length);
    };
    String.prototype.type = "text";
    let listOfPhotoNames = [];
    rawData.forEach(d => {
        let date = new Date(d.created_at);
        //Combine every two hours
        date.setHours(date.getHours()-date.getHours()%3);

        date = outputFormat(date);
        if (!data[date]) data[date] = {};
        let tweet_id = d.id_str;
        let words = processTextToWords(d.text, phrases, removePhrases, stopWords);
        data[date][tweetTopic] = data[date][tweetTopic] ? (data[date][tweetTopic].concat(words)) : (words);
        //Check
        let instagram = instagramData.find(d => d['tweet_id_str'] === tweet_id);
        if (instagram) {
            let instagram_words = processTextToWords(instagram.text, phrases, removePhrases, stopWords);
            let picture = instagram['photo_name'];
            listOfPhotoNames.push(picture);
            instagram_words.push(picture);
            data[date][instagramTopic] = data[date][instagramTopic] ? (data[date][instagramTopic].concat(instagram_words)) : (instagram_words);

        }
    });

    delete data['2020-04-23, 03'];

    data = d3.keys(data).map(function (date) {
        let words = {};
        let raw = {};
        [tweetTopic, instagramTopic].map(topic => {
            raw[topic] = data[date][topic];
            //Count word frequencies
            // console.log(date);
            // console.log(raw[topic]);
            let counts = raw[topic].reduce(function (obj, word) {
                if (!obj[word]) {
                    obj[word] = 0;
                }
                obj[word]++;
                return obj;
            }, {});
            //Convert to array of objects
            words[topic] = d3.keys(counts).map(function (d) {
                let isPicture = listOfPhotoNames.indexOf(d) >= 0;
                return {
                    text: d,
                    frequency: isPicture ? 5 : counts[d],
                    topic: topic,
                    type: isPicture ? "picture" : "text"
                }
            }).sort(function (a, b) {//sort the terms by frequency
                return b.frequency - a.frequency;
            }).filter(function (d) {//filter out empty words
                return d.text;
            });
            // words[topic] = words[topic].slice(0, d3.min([words[topic].length, 100]));
        });
        return {
            date: date,
            words: words
        }
    }).sort(function (a, b) {//sort by date
        return a.date.localeCompare(b.date);
    });

    console.log(data);

    // draw(data);

    //<editor-fold desc="text cleaning">
    function processTextToWords(text, phrases, removePhrases, stopWords) {
        //Reserve the phrase
        text = reservePhrasesFromText(text, phrases);
        //Remove the phrases
        text = removePhrasesFromText(text, removePhrases);
        return extractWordsFromText(text, stopWords);
    }

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
        return word.toLowerCase();
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

    function reservePhrasesFromText(text, phrases) {
        phrases.forEach((p, i) => {
            let startIdx = -1;
            do {
                startIdx = text.toLowerCase().indexOf(p.toLowerCase())
                if (startIdx >= 0) {
                    for (let j = 0; j < p.length; j++) {
                        text = text.replaceAt((startIdx + j), p[j]);//convert to the phrase careless of cases for each character
                    }
                    text = text.replace(p, 'myphrase' + i);//replace p
                }
            } while (startIdx >= 0);//keep doing this to make sure that we replace all phrases
        });
        return text;
    }

    function removePhrasesFromText(text, removePhrases) {
        //This is to make sure that we remove phrase both in upper or lower case
        removePhrases.forEach((p, i) => {
            let startIdx = -1;
            do {
                startIdx = text.toLowerCase().indexOf(p.toLowerCase());
                if (startIdx >= 0) {
                    for (let j = 0; j < p.length; j++) {
                        text = text.replaceAt(startIdx + j, p[j]);//convert to the phrase careless of cases for each character
                    }
                    text = text.replace(p, 'removephrase');//replace p to the removephrase
                }
            } while (startIdx >= 0);//Repeating this to make sure tha we replace all occurrences
        });
        text = text.replace('removephrase', '');//Now actually remove it.
        return text;
    }

    function extractWordsFromText(text, stopWords) {
        let words = text.split(' ');
        words = words.map(d => sanitizeWord((d)));
        //Put the reserved phrase back
        phrases.forEach((p, i) => {
            words.forEach((w, j) => {
                if (w === "myphrase" + i) words[j] = p;
            });
        });
        words = removeStopWords(words, stopWords);
        words = words.filter(t => t != '');//remove empty words
        return words;
    }

    //</editor-fold>
}

