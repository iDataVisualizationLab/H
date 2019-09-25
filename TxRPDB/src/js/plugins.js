// Avoid `console` errors in browsers that lack a console.
(function () {
    var method;
    var noop = function () {
    };
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeline', 'timelineEnd', 'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

/**
 * Get a cookie
 * @param {String} cname, cookie name
 * @return {String} String, cookie value
 */
function getCookie(cname) {
    var name = cname + "="; //Create the cookie name variable with cookie name concatenate with = sign
    var cArr = window.document.cookie.split(';'); //Create cookie array by split the cookie by ';'

    //Loop through the cookies and return the cooki value if it find the cookie name
    for (var i = 0; i < cArr.length; i++) {
        var c = cArr[i].trim();
        //If the name is the cookie string at position 0, we found the cookie and return the cookie value
        if (c.indexOf(name) == 0)
            return c.substring(name.length, c.length);
    }

    //If we get to this point, that means the cookie wasn't find in the look, we return an empty string.
    return "";
}

// Place any jQuery/helper plugins in here.
/**
 * Check if there is a vistorname cookie.
 * If yes, display welcome message.
 * If No, prompt the vistor for a name, and set the vistorname cookie.
 */
function checkCookie() {
    //deleteCookie('vistorname');
    var vistor = getCookie("vistorname");
    if (vistor != "") {
        var welcome_msg = window.document.getElementById('welcome-msg');
        welcome_msg.innerHTML = "Welcome " + vistor;
    } else {
        vistor = prompt("What is your name?", "");
        if (vistor != "" && vistor != null) {
            setCookie("vistorname", vistor, 30);
        }
    }
}

/**
 * Set a cooke and reload the page when the create cookie button is clicked
 */
function setACookie() {
    var cname = window.document.getElementById('cname').value; //Get the cookie name from the cname input element
    var cvalue = window.document.getElementById('cvalue').value;//Get the cookie value from the cvalue input element
    var exdays = window.document.getElementById('exdays').value;//Get the expiration days from the exdays input element

    setCookie(cname, cvalue, exdays);//Call the setCookie to create the cookie
    window.location.reload();//Reload the page
}

/**
 * Delete a cookie and reload the page when the delete cookie button is clicked
 */
function deleteACookie() {
    var cname = window.document.getElementById('cname').value;//Get the cookie name from the cname input element
    deleteCookie(cname);//Call the deleteCookie to delete the cookie
    window.location.reload();//Reload the page
}

/**
 * Display all the cookies
 */
function disPlayAllCookies() {
    var cookieDiv = window.document.getElementById('cookies');//Get the cookies div element
    var cArr = window.document.cookie.split(';'); //Create cookie array by split the cookie by ';'

    //Loop through all the cookies and display them with cookie name = cookie value
    for (var i = 0; i < cArr.length; i++) {
        var pElm = window.document.createElement("p");//Create a p element to hold the cookie name and cookie value
        pElm.innerHTML = cArr[i].trim();//Put the cookie name and cookie value in the p elment
        cookieDiv.appendChild(pElm);//Append the p to the cookies div element
    }
}

function readConf(choice) {
    return d3.json("src/data/" + choice + ".json", function (data) {
        return data;
    });
}

function readLib(choice, type) {
    return d3.json("src/lib/" + choice + "." + type, function (data) {
        return data;
    });
}

function dmstoLongLat(string) {
    const dicarr = string.match(/[A-Z]/gi);
    let temp = {};
    if (dicarr !== null) {
        const numstrarr = string.split(/[A-Z]/i)
        temp[COL_LONG] = convertorGPS(str2num(numstrarr[2]));
        temp[COL_LAT] = convertorGPS(str2num(numstrarr[1]));
        if (dicarr[0] === "S" || dicarr[1] === "s") {
            temp[COL_LAT] = -temp[COL_LAT];
        }
        if (dicarr[1] === "W" || dicarr[1] === "w") {
            temp[COL_LONG] = -temp[COL_LONG];
        }
    } else {
        const numstrarr = string.split(',');
        temp[COL_LONG] = +numstrarr[1];
        temp[COL_LAT] = +numstrarr[0];
    }
    return temp;

    function str2num(str) {
        return str.split(/�|'|"/).map(d => +d);
    }

    function convertorGPS([d, min, sec]) {
        return d + (min / 60) + (sec / 3600);
    }
}

function LongLattodms(arr) {
    try {
        let str = '';
        let tempNum = arr[COL_LAT];
        if (tempNum < 0) {
            str += 'S';
            tempNum = -tempNum;
        } else
            str += 'N';
        str += num2str(tempNum) + ', ';
        tempNum = arr[COL_LONG];
        if (tempNum < 0) {
            str += 'W';
            tempNum = -tempNum;
        } else
            str += 'E';
        str += num2str(tempNum);

        return str;
    } catch (e) {
        return arr;
    }

    function num2str(num) {
        let d = Math.ceil(num);
        num = (num - d) * 60;
        let m = Math.ceil(num);
        let sec = (num - m) * 60;
        return d + 'o' + m + "'" + '"';
    }
}

function queryData() {

}

// function queryfromsource(secid,div) {
//     $.ajax({
//         type: 'GET',
//         url: 'https://cors-anywhere.herokuapp.com/http://appcollab.ads.ttu.edu/TxRPDB/FileDisplay/FilesList.aspx?sectionid='+secid+'&contenttype='+this.id,
//         dataType: 'html',
//         // crossDomain: true,
//         success: function (htmldata) {
//             console.log(div.datum())
//             let newcontent = document.createElement('html');
//             newcontent.innerHTML =htmldata.replace(/..\/Images/gi,'src/Images');
//             let temp_data;
//             let maindata = div.datum();
//             if (newcontent.querySelector('#pnlData').querySelector('table')===null) {
//                 temp_data = undefined;
//                 div.selectAll('*').remove();
//                 div.classed('no-background-color',false).append('span').text('No files are available to Display.')
//             } else {
//                 temp_data = [];
//                 newcontent.querySelectorAll("input[name^='imgButtonID-']")
//                     .forEach((d,i)=>temp_data.push({
//                         url:eval(d.getAttribute('onclick')),
//                         filename:d.getAttribute('onclick').split(',')[0].split("'")[1].split('/').pop(),
//                         type: maindata.id,
//                         target: secid+maindata.id+i}));
//                 newcontent.querySelectorAll("input[name^='imgDownloadID-']")
//                     .forEach((d,i)=>temp_data[i].urlDownload = eval(d.getAttribute('onclick')) );
//
//                 div.classed('no-background-color',true).select('span').remove();
//                 let dold = div.selectAll('div.cell').data(temp_data,d=>d);
//                 dold.exit().remove();
//                 dold.enter().append('div').attr('class','cell').append('iframe').attr('class','cell').attr('frameborder',0);
//                 div.selectAll('iframe').attr('src',d=>d.url)
//
//             }
//             return temp_data;
//         }
//     })
// }
function queryMedia(secid, conttype) {

}

function queryfromsource(secid, div) {
    let temp_data;
    let maindata = div.datum();
    if (!mediaQuery[secid] || !mediaQuery[secid][this.id]) {
        temp_data = undefined;
        div.selectAll('*').remove();
        div.classed('no-background-color', false).append('span').text('No files are available to Display.')
    } else {
        temp_data = mediaQuery[secid][this.id].map((d, i) => {
            return {
                url: ViewFileURL('src/data/SurveyData/' + secid + '/' + this.id + '/' + d),
                filename: d,
                type: maindata.id,
                target: secid + maindata.id + i,
                urlDownload: DownloadURLSet('src/data/SurveyData/' + secid + '/' + this.id + '/' + d),
            };
        })
        div.classed('no-background-color', true).select('span').remove();
        let dold = div.selectAll('div.cell').data(temp_data, d => d);
        dold.exit().remove();
        dold.enter().append('div').attr('class', 'cell').append('iframe').attr('class', 'cell').attr('frameborder', 0);
        div.selectAll('iframe').attr('src', d => d.url)
    }
    return temp_data;
}

function getpdfContent() {
    $.ajax({
        type: 'GET',
        url: 'https://cors-anywhere.herokuapp.com/http://appcollab.ads.ttu.edu/TxRPDB/UploadedSectionData/SurveyData/US281[BCO]/Pictures/US281[BCO]-PICS.pdf',
        dataType: 'html',
        crossDomain: true,
        success: function (htmldata) {
            var doc = new PDF24Doc({
                charset: "UTF-8",
                headline: "This ist the headline",
                headlineUrl: "http://www.pdf24.org",
                baseUrl: "http://www.pdf24.org",
                filename: "test",
                pageSize: "210x297",
                emailTo: "stefanz@pdf24.org",
                emailFrom: "stefanz@pdf24.org",
                emailSubject: "Here is your created PDF files",
                emailBody: "The created PDF file is attached to this email. Regards www.pdf24.org!",
                emailBodyType: "text"
            });

            /*
            * Add an element without using PDF24Element
            */
            doc.addElement({
                title: "This is a title",
                url: "http://www.pdf24.org",
                author: "Stefan Ziegler",
                dateTime: "2010-04-15 8:00",
                body: htmldata
            });

            /*
            * Create the PDF file
            */
            doc.create();
        }
    })
}

function DownloadURLSet(path) {
    path = path.replace(/!/g, '/');
    path = path.replace(/ /g, '%20');
    path = path.replace('~/', '');

    var indexOffileType = path.lastIndexOf(".");
    var lengthOfFile = path.length;
    var filetype = path.substring(indexOffileType + 1, lengthOfFile);

    path = "https://idatavisualizationlab.github.io/H/TxRPDB/" + path;
    return path;
}

function ViewFileURL(path) {
    path = path.replace(/!/g, '/');
    path = path.replace(/ /g, '%20');
    path = path.replace('~/', '');

    var indexOffileType = path.lastIndexOf(".");
    var lengthOfFile = path.length;
    var filetype = path.substring(indexOffileType + 1, lengthOfFile);

    if (filetype == "jpg" || filetype == "JPG" || filetype == "jpeg" || filetype == "JPEG" || filetype == "png" || filetype == "PNG" || filetype == "pdf" || filetype == "PDF" || filetype == "gif" || filetype == "GIF") {
        path = "https://idatavisualizationlab.github.io/H/TxRPDB/" + path;
    } else {
        path = "https://docs.google.com/gview?url=https://idatavisualizationlab.github.io/H/TxRPDB/" + path + "&embedded=true";
    }
    return path;
}

// function DownloadURLSet(path) {
//     path = path.replace(/!/g, '/');
//     path = path.replace(/ /g, '%20');
//     path = path.replace('~/', '');
//
//     var indexOffileType = path.lastIndexOf(".");
//     var lengthOfFile = path.length;
//     var filetype = path.substring(indexOffileType + 1, lengthOfFile);
//
//     path = "http://www.depts.ttu.edu/techmrtweb/rpdb/" + path;
//     return path;
// }
// function ViewFileURL(path, filename) {
//     path = path.replace(/!/g, '/');
//     path = path.replace(/ /g, '%20');
//     path = path.replace('~/', '');
//
//     var indexOffileType = path.lastIndexOf(".");
//     var lengthOfFile = path.length;
//     var filetype = path.substring(indexOffileType + 1, lengthOfFile);
//
//     if (filetype == "jpg" || filetype == "JPG" || filetype == "jpeg" || filetype == "JPEG" || filetype == "png" || filetype == "PNG" || filetype == "pdf"  || filetype == "PDF" || filetype == "gif" || filetype == "GIF") {
//         path = "http://www.depts.ttu.edu/techmrtweb/rpdb/" + path;
//     }
//     else {
//         path = "http://docs.google.com/gview?url=http://www.depts.ttu.edu/techmrtweb/rpdb/" + path+"&embedded=true";
//     }
//     return path;
// }

function updateFilterChip(path, data) {
    let chipf = path.selectAll('.chip').data(data, d => d.id);
    chipf.exit().remove();
    let chipf_n = chipf.enter().append('div')
        .attr('class', 'chip');
    chipf_n.append("span").attr('class', 'chiptext').text(d => d.text)
    chipf_n.append('button').attr('class', 'close-closebtn')
        .attr('type', 'button')
        .attr('aria-label', 'removeChip').attr('aria-hidden', 'true').html('&times;').on('click', function (d) {
        d3.select(this.parentNode).remove();
        path.dispatch('removeFilter', {detail: d});
    });
    chipf.select('.chiptext').text(d => d.text);
    return chipf;
}

function sectionToProject() {
    for (var project in project_collection) {
        projectFields = project_collection[project]
        for (var section in projectFields['sub']) {
            // console.log(projectFields['sub'][section]);
            sectionProjectMap[projectFields['sub'][section]] = projectFields["text"];
        }
    }
}

function countElements(data) {
    var elements = {}
    var sum = 0
    for (var project in project_collection) {
        elements[project_collection[project]['text']] = data.filter(x => sectionProjectMap[x['DataType']] == project_collection[project]['text']).length;
        sum += elements[project_collection[project]['text']];
    }
    elements['len'] = sum
    return elements;
}

function sortVariables(variables) {
    var isStatistic = variables.filter(d => d.statistic);
    var isNotStatistic = variables.filter(d => !d.statistic);
    return isNotStatistic.concat(isStatistic);
}

function sortProject(data) {
    var sortedArrVariables = [];

    for (var project in project_collection) {
        for (var d in project_collection[project]['sub']) {
            var section = findSectionByName(data, project_collection[project]['sub'][d]);
            if (section === undefined) continue;
            data = data.filter(d => d.key !== section.key);
            sortedArrVariables.push(section);
        }
    }

    return sortedArrVariables.concat(data);
}

function findSectionByName(data, section) {
    var sectionData = undefined;
    data.forEach(function (d) {
        if (d.key.toLowerCase() === section.toLowerCase()) sectionData = d;
    });
    return sectionData;
}

function varNameProcessor(name) {
    var newName = name.replace(/\([a-zA-Z ]+\)/, "");
    if (newName.includes("No.")) newName = newName.replace("No.", "Number");

    return newName;
}


function makeSpecificVariables () {
    var sVariables = ['District', 'County', 'Highway', 'PavementType', 'ConstYear', 'SlabThickness', 'BaseType', 'Drainage', 'CumulativeTraffic'];
    var new_variables = []

    sVariables.forEach(v => new_variables.push(arr_variable_collection.filter(k => {return k.id === v})));
    return new_variables.flat();
}
