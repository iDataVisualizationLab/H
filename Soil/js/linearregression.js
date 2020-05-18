function linearRegiression(xData, yData){
    var a, b, sumX=0, sumY=0, sumXY=0, sumXX=0;

    var x = 0, y = 0;
    var n = xData.length;

    for(var i = 0; i < n; i++){
        x = xData[i];
        y = yData[i];
        sumX += x;
        sumY += y;
        sumXX += x*x;
        sumXY += x*y;
    }

    var a = (n * sumXY - sumX*sumY)/(n*sumXX - sumX*sumX);
    var b = (sumY/n) - (a*sumX)/n;

    return [a, b];
}
function predict(xData, model){
    var a = model[0];
    var b = model[1];
    var yData = [];
    for(var i = 0; i< xData.length; i++){
        var x = xData[i],
        y = a*x + b;
        yData.push(y);
    }
    return yData;
}
