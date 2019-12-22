/**
 * Just include the JS file (After the body element) and import the style file then call the showLoader(), hideLoader() where needed
 */
(function () {
    let body = document.getElementsByTagName('body')[0];
    let loaderDiv = document.createElement('div');
    loaderDiv.id = 'loader';
    body.appendChild(loaderDiv);
})();

function hideLoader() {
    document.getElementById("loader").style.display = "none";
}
function isLoaderVisible(){
    return document.getElementById("loader").style.display !== "none";
}
function showLoader() {
    document.getElementById("loader").style.display = "block";
}