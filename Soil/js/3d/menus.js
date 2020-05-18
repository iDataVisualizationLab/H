function createMenuStructure(soilPackages, elementSelectionChange) {
    //Build the table
    let elmTab = document.createElement("table");
    let row1 = document.createElement("tr");
    let row2 = document.createElement("tr");

    //Add heavy metal package
    soilPackages.detectedHeavyMetals.forEach(d => {
        let td = createCheckBoxTd(d, elementSelectionChange, false);
        row1.appendChild(td);
    });
    soilPackages.notDetectedHeavyMetals.forEach(d => {
        let td = createCheckBoxTd(d, elementSelectionChange, true);
        row1.appendChild(td);
    });
    let heavyMetalTd = createPackageTD(soilPackages.heavyMetals, soilPackages.heavyMetalsLabel, elementSelectionChange, "red");
    row2.appendChild(heavyMetalTd);

    //Add plant essentials package
    soilPackages.detectedPlantEssentialElements.forEach(d => {
        let td = createCheckBoxTd(d, elementSelectionChange, false);
        row1.appendChild(td);
    });

    let plantEssentialElementsTd = createPackageTD(soilPackages.plantEssentialElements, soilPackages.plantEssentialElementsLabel, elementSelectionChange, "green");
    row2.appendChild(plantEssentialElementsTd);

    //Add pedological features package
    soilPackages.detectedPedologicalFeatures.forEach(d => {
        let td = createCheckBoxTd(d, elementSelectionChange, false);
        td.querySelector("label").style.fontWeight = "bold";
        row1.appendChild(td);
    });

    let pedologicalFeaturesTd = createPackageTD(soilPackages.pedologicalFeatures, soilPackages.pedologicalFeaturesLabel, elementSelectionChange, "blue");
    row2.appendChild(pedologicalFeaturesTd);
    //Add other package
    soilPackages.others.forEach(d => {
        let td = createCheckBoxTd(d, elementSelectionChange, false);
        row1.appendChild(td);
    });
    let othersTd = createPackageTD(soilPackages.others, "Others", elementSelectionChange, "black");
    row2.appendChild(othersTd);


    elmTab.appendChild(row1);
    elmTab.appendChild(row2);
    d3.select('#elementSelectionList').node().appendChild(elmTab);

}

function createCheckBoxTd(d, elementSelectionChange, disabled) {
    let td = document.createElement("td");
    let input = document.createElement("input");
    input.id = `${d.replace(' ', '_')}elementSelectionId`;
    input.class = "elementSelectionListItem";
    input.value = d;
    input.type = "checkbox";

    if (disabled) {
        input.disabled = true;
    } else {
        input.checked = true;
    }

    input.style.marginLeft = '5px';
    input.onchange = elementSelectionChange;
    td.appendChild(input);
    let label = document.createElement("label");
    label.htmlFor = `${d.replace(' ', '_')}elementSelectionId`;
    label.innerText = d;
    if (disabled) {
        label.style.color = "gray";
    }
    td.append(label);
    return td;
}

function createPackageTD(theElements, title, elementSelectionChange, color) {
    let td = createCheckBoxTd(title, elementSelectionChange, false);
    td.style.textAlign = "center";
    td.style.borderTop = "1px solid " + color;
    td.colSpan = theElements.length;
    td.style.color = color;

    return td;
}
