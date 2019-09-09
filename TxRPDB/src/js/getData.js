var scolling = setInterval(function(){
    if (document.documentElement.scrollTop === document.documentElement.scrollHeight) {
        clearInterval(scolling);
        console.log('done scroll');
    }
    else
        window.scrollBy(0,1000);
}, 1000);

count =21;

while ($('td[colspan="8"] table td:last-child a')){
    __doPostBack('ctl00$MainContent$grdSearch','Page$'+count);
    $(theForm)
    count++
}
let count =1;
__doPostBack('ctl00$MainContent$grdSearch','Page$'+count);




// get page data
let dataOb ={}
document.querySelectorAll('.GridAtlItem, .GridItem').forEach(d=>{
    let arr = [];
    d.querySelectorAll('td').forEach(d=>arr.push(d.textContent));
    arr.pop();
    arr.shift();
    dataOb[arr[0]] = {
        sectionID: getstring(arr[0]),
        Highway: getstring(arr[1]),
        Refmark: getstring(arr[2]),
        County: getstring(arr[3]),
        District: getstring(arr[4]),
        DataType: getstring(arr[5])
    }
});
savef()
function getstring(str){
    return str.trim()===""?null:str;
}

function savef (){
    var filename = "serviceTxDOT";
    var type = "json";
    var clone_hostResults = dataOb;

    var str = JSON.stringify(clone_hostResults);


    var file = new Blob([str], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename+'.'+type);
    else { // Others
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename+'.'+type;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}



// process batch
let filequeue = [];
let basedata = {};
for (let i=0;i<23;i++)
    filequeue.push(readConf("batch/serviceTxDOT ("+i+")"))
Promise.all(filequeue).then((dataarr)=>{
    dataarr.forEach(d=>{
        for (let i in d)
            basedata[i] = d[i];
    });
})