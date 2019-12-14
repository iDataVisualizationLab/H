function getCSSVariable(varName) {
    let htmlStyles = window.getComputedStyle(document.querySelector("html"));
    let varVal = parseInt(htmlStyles.getPropertyValue(varName));
    return varVal;
}

function setCSSVariable(varName, varVal) {
    document.documentElement.style.setProperty(varName, varVal);
    return varVal;
}