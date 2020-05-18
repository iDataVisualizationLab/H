function main() {
    //<editor-fold desc="variables">
    let renderer, scene, camera, bgCube, stepHandle, gui;
    let elementInfo1;
    let elementInfo2;

    let nextElementIdx = 0;
    let defaultChartSize = 50;
    let chartPaddings = {
        paddingLeft: 40,
        paddingRight: 40,
        paddingTop: 60,
        paddingBottom: 40
    };

    const ALL_DETECTED = "all detected";
    const packages = {
        "heavy metals": ['Cr', 'Pb', 'Cd', 'Hg', 'As'],
        "plant essential elements": ['Ca', 'Cu', 'Fe', 'K', 'Mn', 'S', 'Zn'],
        "pedological features": ['RI', 'DI', 'SR'], //Ruxton weathering index, Desilication index, "SR Concentration"
        "all detected": []
    }
    let colorOptions = ['categorical', 'interpolation'];
    let profiles = ['Profile1', 'Profile2', 'Profile3'];
    let profileOptions = {
        profileOptionText: 'Profile1'
    }
    let orderOptions = ['cut point', 'horizontal average', 'vertical average', 'none'];
    let viewOptions = {
        orderOption: 0,
        orderOptionText: 'cut point',
        colorOption: 1,//0 use categorical scale + intensity, 1 use scale interpolation.
        colorOptionText: 'interpolation'
    };

    let highlightedElementColor = 'gray';
    let highlightedElementTextColor = 'red';
    let orbitControls, dragControls;
    let verticalPlane, horizontalPlane;
    let verticalPlaneName = "verticalPlane";
    let horizontalPlaneName = "horizontalPlane";
    let stepHandleName = "stepHandle";
    let startElementalPosition = 0;
    let stepHandlerMargin = 3;
    let stepMargin = 2;
    let verticalChart;
    let verticalDetailCharts = [undefined, undefined];

    let horizontalChart;
    let horizontalDetailCharts = [undefined, undefined];

    let elementColorScale;
    let pointSize = 0.05;
    let elementPlaneStepSize = 1;
    let analyzingPointCloudNames = [];
    let pointClouds = [];
    let allPointClouds = [];
    let selectedPointClouds = [];
    let texts = {};
    let width, height, cameraViewWidth, cameraViewHeight, chartWidth, chartHeight;


    let bgCubeSize = {x: 4.6, y: 6.0, z: 1};
    let profileMargin = {left: 0.3, top: 0.5, right: 0.8, bottom: 0.8};

    let profileSize = {
        x: bgCubeSize.x - profileMargin.left - profileMargin.right,
        y: bgCubeSize.y - profileMargin.top - profileMargin.bottom,
        z: 1.5
    };
    let profilePosition = {
        x: -((bgCubeSize.x - profileSize.x) / 2 - profileMargin.left),
        y: (bgCubeSize.y - profileSize.y) / 2 - profileMargin.top,
        z: bgCubeSize.z / 2
    };
    let profileMinMax = {
        minX: -(bgCubeSize.x / 2) + profileMargin.left,
        maxX: (bgCubeSize.x / 2) - profileMargin.right,
        minY: -(bgCubeSize.y / 2) + profileMargin.bottom,
        maxY: (bgCubeSize.y / 2) - profileMargin.top
    }

    let twoDCharts = new TwoDCharts();
    let threeDScences;
    //</editor-fold>

    //Load data
    readData("data/" + "processed-chemistry-Idvl-tommy-house-grid-2020-05-17-14-31-26", handleData);
    // readData("data/" + "Profile1", handleData);

    function handleData(data) {
        if (!contourDataProducer) {
            contourDataProducer = new ContourDataProducer(data);
        }
        elementColorScale = d3.scaleOrdinal().domain(contourDataProducer.allElements).range(d3.schemeCategory20);
        let numElms = contourDataProducer.allElements.length;

        // let numElms = 5;
        //Call the 3d part.
        init();
        hideLoader();
        animate();
        highlightSelectedPointClouds();
        // createMenus(contourDataProducer.allElements, elementSelectionChange);
        let soilPackages = new SoilPackages(contourDataProducer.allElements);
        createMenuStructure(soilPackages, elementSelectionChange);
        //Add all the current elements
        analyzingPointCloudNames = contourDataProducer.allElements.slice();

        function setupScene() {
            let bgGeometry = new THREE.BoxGeometry(bgCubeSize.x, bgCubeSize.y, bgCubeSize.z);
            let bgMaterial = [
                new THREE.MeshStandardMaterial({
                    color: new THREE.Color(1, 1, 1),
                    side: THREE.DoubleSide
                }),
                new THREE.MeshStandardMaterial({
                    color: new THREE.Color(1, 1, 1),
                    side: THREE.DoubleSide
                }),
                new THREE.MeshStandardMaterial({
                    color: new THREE.Color(1, 1, 1),
                    side: THREE.DoubleSide
                }),
                new THREE.MeshStandardMaterial({
                    color: new THREE.Color(1, 1, 1),
                    side: THREE.DoubleSide
                }),
                new THREE.MeshLambertMaterial({
                    map: new THREE.TextureLoader().load('data/images/Profile1.png'),
                    side: THREE.DoubleSide
                    // opacity: 0.5,
                    // transparent: true
                }),
                new THREE.MeshStandardMaterial({
                    color: new THREE.Color(1, 1, 1),
                    side: THREE.DoubleSide
                })
            ];

            //The background cube
            bgCube = new THREE.Mesh(bgGeometry, bgMaterial);
            bgCube.position.set(0, 6, -numElms * elementPlaneStepSize);
            scene.add(bgCube);

            const aspect = (cameraViewWidth / cameraViewHeight);
            //
            camera = new THREE.PerspectiveCamera(60, aspect, 1, 100);

            //
            camera.position.set(25, bgCube.position.y, bgCube.position.z / 2);

            camera.lookAt(0, bgCube.position.y, bgCube.position.z / 2);
            // camera.lookAt(-10, -10, bgCube.position.z / 2);

            //The cutting planes
            let planeMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color(1, 1, 1)
            });


            let vpg = new THREE.BoxBufferGeometry(0.1, bgCubeSize.y + 0.2, bgCubeSize.z + 0.2);
            verticalPlane = new THREE.Mesh(vpg, planeMaterial.clone());
            verticalPlane.position.set(profilePosition.x, 0, 0);//This is relative to the Cube (since we are adding it to the cube)
            verticalPlane.name = verticalPlaneName;
            bgCube.add(verticalPlane);

            let hpg = new THREE.BoxBufferGeometry(bgCubeSize.x + 0.2, 0.1, bgCubeSize.z + 0.2);
            horizontalPlane = new THREE.Mesh(hpg, planeMaterial);
            horizontalPlane.position.set(0, profilePosition.y, 0);//This is relative to the Cube (since we are adding it to the cube)
            horizontalPlane.name = horizontalPlaneName;
            bgCube.add(horizontalPlane);

            //TODO: This place is a quick fix for filtering package information
            let thePackage = ALL_DETECTED;
            if (thePackage === ALL_DETECTED) {
                packages[ALL_DETECTED] = contourDataProducer.allElements;
            }
            //Store all the elements (to keep track of its index inside the data)
            let allElements = contourDataProducer.allElements.slice();
            allElements = allElements.filter(d => packages[thePackage].indexOf(d) >= 0);
            //Update package information (since some elements in the package may not be detectable in this profile.
            packages[thePackage] = allElements;
            numElms = packages[thePackage].length;

            //Generate the point clouds
            for (let i = 0; i < numElms; i++) {
                let d3c = null;
                if (viewOptions.colorOption === 0) {
                    d3c = d3.color(elementColorScale(contourDataProducer.allElements[i]));
                }
                allPointClouds[i] = generatePointcloudForElmIdx(contourDataProducer.allElements.indexOf(packages[thePackage][i]), d3c, pointSize);//Since index i now has different index for the element
                allPointClouds[i].scale.set(profileSize.x, profileSize.y, profileSize.z);
                allPointClouds[i].name = packages[thePackage][i];
                allPointClouds[i].position.set(profilePosition.x, profilePosition.y, startElementalPosition + profilePosition.z + i * elementPlaneStepSize + stepMargin);
            }
            //TODO: Do filtering
            pointClouds = allPointClouds.slice();

            for (let i = 0; i < numElms; i++) {
                //this is for filtering and add to background.
                bgCube.add(pointClouds[i]);
            }

            // Setup all the texts
            let container1 = d3.select("#container1");
            for (let i = 0; i < pointClouds.length; i++) {
                let xy = pointCloud2TextCoordinate(pointClouds[i], camera, cameraViewWidth, cameraViewHeight);
                texts[pointClouds[i].name] = container1.append("div")
                    .attr("id", 'elmText' + i)
                    .style('position', 'absolute')
                    .style("left", xy.x + "px")
                    .style("top", xy.y + "px");
                texts[pointClouds[i].name].append('text').text(pointClouds[i].name);
            }
            //These are the two selected elements in the details comparison
            selectedPointClouds[0] = pointClouds[0];
            selectedPointClouds[1] = pointClouds[1];


            elementInfo1 = threeDScences.setupElementScene1(pointClouds[0], elementInfo1);
            elementInfo2 = threeDScences.setupElementScene2(pointClouds[1], elementInfo2);
            //By default setup the orbit control for the first one
            setupOrbitControls(elementInfo1, elementInfo2, document.getElementById('detailChart1'));
            //Also setup orbit controls for these
            d3.select("#detailChart1").on("mouseover", function () {
                setupOrbitControls(elementInfo1, elementInfo2, this);
            });
            d3.select("#detailChart2").on("mouseover", function () {
                setupOrbitControls(elementInfo1, elementInfo2, this);
            });

            //Set the handle for step size.
            let stepHandleGemoetry = new THREE.SphereBufferGeometry(0.5, 50, 50);
            let stepHandleMaterial = new THREE.MeshStandardMaterial({color: new THREE.Color('steelblue')});
            stepHandle = new THREE.Mesh(stepHandleGemoetry, stepHandleMaterial);
            stepHandle.name = stepHandleName;
            stepHandle.position.set(profilePosition.x, profilePosition.y, profilePosition.z + (pointClouds.length - 1) * elementPlaneStepSize + stepMargin + stepHandlerMargin);
            bgCube.add(stepHandle);


            let aLight = new THREE.AmbientLight(new THREE.Color(0.7, 0.7, 0.7), 1.0);
            scene.add(aLight);

        }

        function setupOrbitControls(elementInfo1, elementInfo2, domElement) {
            let orbitControls1 = new THREE.OrbitControls(elementInfo1.camera, domElement);
            orbitControls1.target.set(0, 0, 0);
            orbitControls1.update();
            let orbitControls2 = new THREE.OrbitControls(elementInfo2.camera, domElement);
            orbitControls2.target.set(0, 0, 0);
            orbitControls2.update();
            elementInfo1.orbitContols = orbitControls1;
            elementInfo2.orbitContols = orbitControls2;
        }

        function updateTextPositions() {
            pointClouds.forEach((pc, i) => {
                let xy = pointCloud2TextCoordinate(pc, camera, cameraViewWidth, cameraViewHeight);
                texts[pc.name].text(pc.name);
                texts[pc.name].style('position', 'absolute').style("left", xy.x + "px").style("top", (xy.y - 10) + "px");
            });

        }

        function pointCloud2TextCoordinate(object, camera, width, height) {
            try {
                let pos = new THREE.Vector3();
                pos = pos.setFromMatrixPosition(object.matrixWorld);
                pos.x = pos.x - profileSize.x / 2;
                pos.y = pos.y + profileSize.y / 2;
                pos.z = pos.z + profileSize.z / 2;
                pos.project(camera);

                let widthHalf = width / 2;
                let heightHalf = height / 2;

                pos.x = (pos.x * widthHalf) + widthHalf;
                pos.y = -(pos.y * heightHalf) + heightHalf;
                pos.z = 0;
                return {x: pos.x, y: pos.y};
            } catch (e) {
                //TODO: this is only a quick fix. The text doesn't exist, just hide them
                return {x: -100, y: -100}
            }


        }

        //Cut data
        function collectHorizontalCutData() {
            return cutplanes.collectCutData('horizontal', pointClouds, horizontalPlane, verticalPlane, profilePosition, profileSize, viewOptions, sortPointCloudsAsIdxs, updatePointCloudPositions);
        }

        function collectVerticalCutData() {
            return cutplanes.collectCutData('vertical', pointClouds, horizontalPlane, verticalPlane, profilePosition, profileSize, viewOptions, sortPointCloudsAsIdxs, updatePointCloudPositions);
        }

        //<editor-fold desc="framework tasks">

        function init() {
            setSizes();

            let container1 = document.getElementById('container1');

            scene = new THREE.Scene();
            scene.background = new THREE.Color(1, 1, 1);


            gui = new dat.GUI({autoPlace: true});
            gui.domElement.id = 'gui';

            //Section for the profiles.
            let profileFolder = gui.addFolder("Profiles");
            profileFolder.add(profileOptions, 'profileOptionText', profiles).name("Select profile");


            //Section for the view options (including of order and colors, but currently not using colors)
            let viewOptionsFolder = gui.addFolder('View options');
            viewOptionsFolder.add(viewOptions, 'orderOptionText', orderOptions)
                .name('order')
                .onChange(function (value) {
                    switch (value) {
                        case orderOptions[0]: //At the cut point
                            viewOptions.orderOption = 0;
                            break;
                        case orderOptions[1]: //Average horizontal
                            viewOptions.orderOption = 1;
                            break;
                        case orderOptions[2]: //Average vertical
                            viewOptions.orderOption = 2;
                            break;
                        case orderOptions[3]: //None
                            viewOptions.orderOption = 3;
                            break;
                    }
                    //TODO: Change order options.
                    if (value !== 'none') {
                        updateCharts();//Update chart also updates the plane positions
                    }
                });
            let resetFolder = gui.addFolder('Reset views');
            resetFolder.add({
                'main view': function () {
                    resetMainView();
                }
            }, 'main view');

            resetFolder.add({
                'detail views': function () {
                    resetDetailsViews();
                }
            }, 'detail views');

            // resetFolder.add({
            //     'chart views': function () {
            //         resetHorizontalAndVerticalCharts();
            //     }
            // }, 'chart views');

            resetFolder.add({
                'all views': function () {
                    resetMainView();
                    resetDetailsViews();
                    // resetHorizontalAndVerticalCharts();
                }
            }, 'all views');

            gui.width = 260;
            d3.select('#elementSelectionList')
                .style('position', 'absolute')
                .style('left', `${(gui.width + 5)}px`);
            gui.close();


            function resetMainView() {
                //Reset the main camera.
                orbitControls.reset();
                orbitControls.target.set(0, 0, bgCube.position.z / 2);
                orbitControls.update();
            }

            function resetDetailsViews() {
                //Reset the two sceneInfo
                if (elementInfo1.orbitContols) {
                    elementInfo1.orbitContols.reset();
                }
                if (elementInfo2.orbitContols) {
                    elementInfo2.orbitContols.reset();
                }
            }

            // function resetHorizontalAndVerticalCharts() {
            //     //TODO: to be done.
            // }


            //
            renderer = new THREE.WebGLRenderer({antialias: true});
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(cameraViewWidth, cameraViewHeight);
            container1.appendChild(renderer.domElement);
            d3.select(container1).select('canvas').style('outline', 'none');

            //
            threeDScences = new ThreeDScences(renderer, profileSize);

            //
            setupScene();

            //
            window.addEventListener('resize', onWindowResize, false);

            //
            orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
            orbitControls.target.set(0, 0, bgCube.position.z / 2);
            orbitControls.update();

            //<editor-fold desc="For the drag controls">

            //Get the highlight color for the hover

            let highlightedElementColorV3 = pointClouds[0].geometry.attributes.color.clone();
            highlightedElementColorV3.array = highlightedElementColorV3.array.slice();//Deep copy for the array value
            let highlightedElementColorD3 = d3.color(highlightedElementColor);
            highlightedElementColorD3.r = highlightedElementColorD3.r / 255;
            highlightedElementColorD3.g = highlightedElementColorD3.g / 255;
            highlightedElementColorD3.b = highlightedElementColorD3.b / 255;
            for (let i = 0; i < highlightedElementColorV3.array.length; i += 3) {
                highlightedElementColorV3.array[i] = highlightedElementColorD3.r;
                highlightedElementColorV3.array[i + 1] = highlightedElementColorD3.g;
                highlightedElementColorV3.array[i + 2] = highlightedElementColorD3.b;
            }

            let prevColor;
            let prevObject;
            let elementPos;

            //cut planes drag controls
            let verticalPlanePos;
            let horizontalPlanePos;

            dragControls = new THREE.DragControls([verticalPlane, horizontalPlane, stepHandle, ...pointClouds], camera, renderer.domElement);
            //Add event listener to highlight dragged objects
            dragControls.addEventListener('hoveron', function (event) {
                if (event.object.name === stepHandleName || event.object.name === verticalPlaneName || event.object.name === horizontalPlaneName) {//Two planes + step handle
                    event.object.material.emissive.set(0xaa0000);
                    //Update annotations + disable highlight of trace series
                    if (event.object.name === verticalPlaneName) {
                        horizontalChart.settings.annotations.xLine.color = 'pink';
                        changeSlicesAnnotationColors(horizontalDetailCharts, 'xLine', 'pink');
                    }
                    if (event.object.name === horizontalPlaneName) {
                        verticalChart.settings.annotations.yLine.color = 'pink';
                        changeSlicesAnnotationColors(verticalDetailCharts, 'yLine', 'pink');
                    }
                    verticalChart.highlightTraceSeries();
                    horizontalChart.highlightTraceSeries();
                } else { //Must be the element planes
                    //Reset prev object values => this step is to assure that we rest the previous one before setting any other one.
                    if (prevObject && prevColor) {
                        prevObject.geometry.attributes.color = prevColor;
                    }
                    //Set now
                    prevObject = event.object;
                    prevColor = prevObject.geometry.attributes.color.clone();
                    prevColor.array = prevColor.array.slice();//Deep copy
                    event.object.geometry.attributes.color = highlightedElementColorV3;
                    verticalChart.highlightTraceSeries(event.object.name, highlightedElementColor);
                    horizontalChart.highlightTraceSeries(event.object.name, highlightedElementColor);
                    d3.keys(texts).forEach(k => {
                        let text = texts[k];
                        if (text.text() === event.object.name) {
                            text.style('color', highlightedElementTextColor);
                        } else {
                            text.style('color', 'black');
                        }
                    });
                }
            });
            dragControls.addEventListener('hoveroff', function (event) {
                if (event.object.name === verticalPlaneName || event.object.name === horizontalPlaneName || event.object.name === stepHandleName) {//Two planes
                    event.object.material.emissive.set(0x000000);
                    //Update annotations + disable highlight of trace series
                    if (event.object.name === verticalPlaneName) {
                        horizontalChart.settings.annotations.xLine.color = 'gray';
                        changeSlicesAnnotationColors(horizontalDetailCharts, 'xLine', 'gray');
                    }
                    if (event.object.name === horizontalPlaneName) {
                        verticalChart.settings.annotations.yLine.color = 'gray';
                        changeSlicesAnnotationColors(verticalDetailCharts, 'yLine', 'gray');
                    }
                    verticalChart.highlightTraceSeries();
                    horizontalChart.highlightTraceSeries();
                } else { //Element Planes
                    event.object.geometry.attributes.color = prevColor;
                    //Update annotations + disable highlight of trace series
                    if (event.object.name === verticalPlaneName) {
                        horizontalChart.settings.annotations.xLine.color = 'gray';
                    }
                    if (event.object.name === horizontalPlaneName) {
                        verticalChart.settings.annotations.yLine.color = 'gray';
                    }
                    verticalChart.highlightTraceSeries();
                    horizontalChart.highlightTraceSeries();
                    d3.keys(texts).forEach(k => {
                        let text = texts[k];
                        text.style('color', 'black');
                    });
                }

            });
            dragControls.addEventListener('dragstart', function (event) {
                orbitControls.enabled = false;

                if (event.object.name === verticalPlaneName || event.object.name === horizontalPlaneName) {//Two planes
                    //Record the plane current positions
                    verticalPlanePos = verticalPlane.position.clone();
                    horizontalPlanePos = horizontalPlane.position.clone();
                } else if (event.object.name === stepHandleName) {
                    //Copy the current position
                    elementPos = event.object.position.clone();
                } else {
                    //Copy the current position
                    elementPos = event.object.position.clone();
                    //Highlight the element
                    verticalChart.highlightTraceSeries(event.object.name, highlightedElementColor);
                    horizontalChart.highlightTraceSeries(event.object.name, highlightedElementColor);
                    //Set the investigating element.
                    nextElementIdx = (nextElementIdx + 1) % 2;
                    selectedPointClouds[nextElementIdx] = event.object;
                    //Highlight selected pointClouds
                    highlightSelectedPointClouds();
                    if (nextElementIdx === 0) {
                        elementInfo1 = threeDScences.setupElementScene1(event.object, elementInfo1);
                        //Update text
                    } else {
                        elementInfo2 = threeDScences.setupElementScene2(event.object, elementInfo2);
                    }
                    //TODO: may just store the cut data so we do not have to collect them again
                    twoDCharts.drawVerticalSlices(collectVerticalCutData(), verticalChart, horizontalChart, selectedPointClouds, verticalDetailCharts, defaultChartSize, chartPaddings, chartWidth, chartHeight, elementColorScale);
                    twoDCharts.drawHorizontalSlices(collectHorizontalCutData(), verticalChart, horizontalChart, selectedPointClouds, horizontalDetailCharts, defaultChartSize, chartPaddings, chartWidth, chartHeight, elementColorScale);
                }

            });
            dragControls.addEventListener('drag', function (event) {
                if (event.object.name === verticalPlaneName || event.object.name === horizontalPlaneName) {//Two planes
                    if (event.object.name === verticalPlaneName) {
                        //Keep vertical plane y and z position.
                        verticalPlane.position.y = verticalPlanePos.y;
                        verticalPlane.position.z = verticalPlanePos.z;
                        //Check for max and min x
                        if (verticalPlane.position.x < 0) {
                            verticalPlane.position.x = Math.max(profileMinMax.minX, verticalPlane.position.x);
                        } else {
                            verticalPlane.position.x = Math.min(profileMinMax.maxX, verticalPlane.position.x);
                        }

                    } else if (event.object.name === horizontalPlaneName) {
                        //Keep horizontal plane x and z position.
                        horizontalPlane.position.x = horizontalPlanePos.x;
                        horizontalPlane.position.z = horizontalPlanePos.z;
                        //Check for max and min y
                        if (horizontalPlane.position.y < 0) {
                            horizontalPlane.position.y = Math.max(profileMinMax.minY, horizontalPlane.position.y);
                        } else {
                            horizontalPlane.position.y = Math.min(profileMinMax.maxY, horizontalPlane.position.y);
                        }

                    }
                    //TODO: We may not need to collect both cut points again, just collect one and resort the another one
                    //Update annotations + disable highlight of trace series
                    if (event.object.name === verticalPlaneName) {
                        horizontalChart.settings.annotations.xLine.color = 'pink';
                    }
                    if (event.object.name === horizontalPlaneName) {
                        verticalChart.settings.annotations.yLine.color = 'pink';
                    }
                    verticalChart.highlightTraceSeries();
                    horizontalChart.highlightTraceSeries();
                    updateCharts();
                } else { //Elements
                    //Highlight the element
                    //Update annotations + disable highlight of trace series
                    if (event.object.name === verticalPlaneName) {
                        horizontalChart.settings.annotations.xLine.color = 'gray';
                    }
                    if (event.object.name === horizontalPlaneName) {
                        verticalChart.settings.annotations.yLine.color = 'gray';
                    }
                    verticalChart.highlightTraceSeries(event.object.name, highlightedElementColor);
                    horizontalChart.highlightTraceSeries(event.object.name, highlightedElementColor);

                    if(elementPos){
                        //Keep x and y, in case the element is still in the view (some might be removed)
                        event.object.position.x = elementPos.x;
                        event.object.position.y = elementPos.y;
                    }


                    if (event.object.name === stepHandleName) {
                        event.object.position.z = Math.max(event.object.position.z, stepHandlerMargin + stepMargin);
                        elementPlaneStepSize = (event.object.position.z - stepHandlerMargin - stepMargin) / (numElms);
                        updatePointCloudPositions();
                    } else {
                        //This place order by dragging.
                        let sortedIdxs = argSort(pointClouds.map(pc => pc.position.z));
                        let sortedPointClouds = [];
                        sortedIdxs.forEach(idx => {
                            sortedPointClouds.push(pointClouds[idx]);
                        });

                        pointClouds = sortedPointClouds;
                        //Update point clouds position.
                        for (let i = 0; i < pointClouds.length; i++) {

                            if (pointClouds[i].name !== event.object.name) {
                                pointClouds[i].position.set(profilePosition.x, profilePosition.y, profilePosition.z + i * elementPlaneStepSize + stepMargin);
                            }
                        }
                        //Now update the charts too
                        twoDCharts.updateChartByIdxs(sortedIdxs, verticalChart, horizontalChart);
                    }
                }
            });
            dragControls.addEventListener('dragend', function (event) {
                orbitControls.enabled = true;
                if (event.object.name === verticalPlaneName || event.object.name === horizontalPlaneName) {//Two planes
                } else {
                    updatePointCloudPositions();
                    //Disable highlight element
                    prevObject.geometry.attributes.color = prevColor;
                    verticalChart.highlightTraceSeries();
                    horizontalChart.highlightTraceSeries();
                }
            });

            //</editor-fold>
            //Draw the initial charts
            updateCharts();

            function changeDetailChartAnnotationColor(theChart, lineType, color) {
                theChart.settings.annotations[lineType].color = color;
                theChart.update(theChart.data);
            }

            function changeSlicesAnnotationColors(slices, lineType, color) {
                slices.forEach(slice => {
                    changeDetailChartAnnotationColor(slice, lineType, color);
                });
            }

        }

        function updateCharts() {
            let horizontalCutData = collectHorizontalCutData();
            horizontalChart = twoDCharts.drawChart(horizontalCutData, verticalChart, horizontalChart, defaultChartSize, chartPaddings, chartWidth, chartHeight, elementColorScale);

            let verticalCutData = collectVerticalCutData();
            verticalChart = twoDCharts.drawChart(verticalCutData, verticalChart, horizontalChart, defaultChartSize, chartPaddings, chartWidth, chartHeight, elementColorScale);

            twoDCharts.drawVerticalSlices(verticalCutData, verticalChart, horizontalChart, selectedPointClouds, verticalDetailCharts, defaultChartSize, chartPaddings, chartWidth, chartHeight, elementColorScale);
            twoDCharts.drawHorizontalSlices(horizontalCutData, verticalChart, horizontalChart, selectedPointClouds, horizontalDetailCharts, defaultChartSize, chartPaddings, chartWidth, chartHeight, elementColorScale);
        }

        function onWindowResize() {
            setSizes();
            const aspect = (cameraViewWidth / cameraViewHeight);
            renderer.setSize(cameraViewWidth, cameraViewHeight);
            camera.aspect = aspect;
            camera.updateProjectionMatrix();
        }

        function animate() {
            requestAnimationFrame(animate);
            updateTextPositions();//TODO: should set this in the OribtControls event (shouldn't set here since is wasting resources).
            render();
        }

        function render() {
            renderer.setScissorTest(false);
            renderer.clear(true, true);
            renderer.setScissorTest(true);
            threeDScences.renderScene(scene, camera, document.getElementById('container1'));
            threeDScences.renderSceneInfo(elementInfo1);
            threeDScences.renderSceneInfo(elementInfo2);

        }

        function deselectAnElement(name, pointClouds, selectedPointClouds) {
            if (pointClouds.length === 2) {
                alert('There must be at least one element to analyze');
                this.checked = true;
            } else {
                //Remove the pointCloud
                let thePointCloud = pointClouds.filter(pc => pc.name === name)[0];
                pointClouds = pointClouds.filter(pc => pc.name !== name);
                //If the element is currently selected, move the selected one to the first of the list
                selectedPointClouds.map((pc, i) => {
                    if (pc.name === thePointCloud.name) {
                        selectedPointClouds[i] = pointClouds[0];
                        //Also redraw th scenes
                        if (i == 0) {
                            elementInfo1 = threeDScences.setupElementScene1(pointClouds[0], elementInfo1);
                        } else {
                            elementInfo2 = threeDScences.setupElementScene2(pointClouds[1], elementInfo2);
                        }
                    }
                });
                //Re-higlight the selected elements
                highlightSelectedPointClouds();
                //Hide the label
                texts[name].style("visibility", "hidden");
                bgCube.remove(thePointCloud);

            }
            return pointClouds;//Store the updated point clouds
        }

        function elementSelectionChange(d) {
            d = d.target.value;

            if (soilPackages.packages.indexOf(d) >= 0) {
                soilPackages.getDetectedElementsFromPackageName(d).forEach(elm => {
                    if ($(this).is(":checked") !== $(`#${elm}elementSelectionId`).is(":checked")) {
                        $(`#${elm}elementSelectionId`).click();
                    }
                });
            } else {
                if (pointClouds.map(d => d.name).indexOf(d) >= 0) {
                    pointClouds = deselectAnElement.call(this, d, pointClouds, selectedPointClouds);
                } else {
                    //Add the pointCloud
                    let name = d;
                    let thePointCloud = allPointClouds.filter(pc => pc.name === name)[0];
                    bgCube.add(thePointCloud);
                    pointClouds.push(thePointCloud);
                    //Show the label
                    texts[name].style("visibility", "visible");
                    updateCharts();//Update chart also updates the plane positions
                }
            }
            //Update vertical/horizontal charts
            horizontalChart = undefined;
            verticalChart = undefined;
            d3.select("#verticalChartContainer").selectAll("*").remove();
            d3.select("#horizontalChartContainer").selectAll("*").remove();
            updateCharts();//Update chart also updates the plane positions

        }

        //</editor-fold>
    }


    function setSizes() {
        width = window.innerWidth;
        height = window.innerHeight;

        chartHeight = height / 2;
        chartWidth = 10 * chartHeight / 13;
        cameraViewWidth = width - chartWidth;
        cameraViewHeight = height;


        let container1 = document.getElementById('container1');
        let container2 = document.getElementById('container2');
        let verticalChartContainer = document.getElementById('verticalChartContainer');
        let horizontalChartContainer = document.getElementById('horizontalChartContainer');
        let detailChart1 = document.getElementById('detailChart1');
        let detailChart2 = document.getElementById('detailChart2');


        let detailChartHeight = chartHeight - chartPaddings.paddingTop - chartPaddings.paddingBottom;
        let detailChartWidth = chartWidth - chartPaddings.paddingLeft - chartPaddings.paddingRight;
        let detailChartMargin = (cameraViewWidth - 2 * detailChartWidth) / 3;
        let detailChartTop1 = height - detailChartHeight - chartPaddings.paddingBottom;
        let detailChartTop2 = detailChartTop1;
        let detailChartLeft1 = detailChartMargin;
        let detailChartLeft2 = detailChartWidth + detailChartMargin * 2;
        let detailSliceCharts = [
            {
                //Left hori
                name: 'horizontalDetailChart1',
                left: detailChartLeft1 - chartPaddings.paddingLeft,
                top: detailChartTop1 - defaultChartSize - chartPaddings.paddingTop - chartPaddings.paddingBottom,
                width: detailChartWidth,
                height: defaultChartSize
            },
            {
                //Left verti
                name: "verticalDetailChart1",
                left: detailChartLeft1 + detailChartWidth,
                top: detailChartTop1 - chartPaddings.paddingTop,
                width: detailChartWidth,
                height: detailChartHeight
            },
            {
                //Right hori
                name: 'horizontalDetailChart2',
                left: detailChartLeft2 - chartPaddings.paddingLeft,
                top: detailChartTop2 - defaultChartSize - chartPaddings.paddingTop - chartPaddings.paddingBottom,
                width: detailChartWidth,
                height: defaultChartSize
            },
            {
                //Right verti
                name: "verticalDetailChart2",
                left: detailChartLeft2 + detailChartWidth,
                top: detailChartTop2 - chartPaddings.paddingTop,
                width: defaultChartSize,
                height: detailChartHeight
            },
        ];


        d3.select(container1)
            .style('position', 'absolute')
            .style("left", "0px")
            .style("top", "0px")
            .style("width", cameraViewWidth + "px")
            .style("height", cameraViewHeight + "px")
            .style('outline', 'none');

        d3.select(container2).style('position', 'absolute')
            .style("left", `${cameraViewWidth}px`)
            .style("top", "0px")
            .style("width", chartWidth + "px")
            .style("height", cameraViewHeight + "px")
            .style('outline', 'none');

        d3.select(verticalChartContainer)
            .style('position', 'absolute')
            .style('left', '0px')
            .style('top', "0px")
            .style('width', chartWidth + "px")
            .style('height', chartHeight + "px")
            .style('outline', 'none');

        d3.select(horizontalChartContainer)
            .style('position', 'absolute')
            .style('left', '0px')
            .style('top', chartHeight + "px")
            .style('width', chartWidth + "px")
            .style('height', chartHeight + "px")
            .style('outline', 'none');

        d3.select(detailChart1)
            .style('position', 'absolute')
            .style('left', detailChartLeft1 + 'px')
            .style('top', detailChartTop1 + 'px')
            .style('width', detailChartWidth + "px")
            .style('height', detailChartHeight + "px")
            .style('border', '1px solid black')
            .style('outline', 'none')
            .append('div')//for the text
            .attr("id", "detailElmText1")
            .attr("class", "elementText")
            .style("position", "absolute")
            .style("left", "10px")
            .style("top", "10px");


        d3.select(detailChart2)
            .style('position', 'absolute')
            .style('left', detailChartLeft2 + 'px')
            .style('top', detailChartTop2 + 'px')
            .style('width', detailChartWidth + "px")
            .style('height', detailChartHeight + "px")
            .style('border', '1px solid black')
            .style('outline', 'none')
            .append('div')//for the text
            .attr("id", "detailElmText2")
            .attr("class", "elementText")
            .style("position", "absolute")
            .style("left", "10px")
            .style("top", "10px");


        //Redraw the charts in new size
        let detailSclieChartSelections = d3.selectAll(".detailSliceCharts").data(detailSliceCharts, d => d.name);
        //Enter
        let detailSclieChartEnters = detailSclieChartSelections.enter().append("div")
            .attr("class", "detailSliceCharts")
            .attr("id", d => d.name);
        //Merge
        detailSclieChartSelections = detailSclieChartSelections.merge(detailSclieChartEnters);
        //Update
        detailSclieChartSelections
            .style("position", "absolute")
            .style("left", d => d.left + "px")
            .style("top", d => d.top + "px")
            .style("width", d => d.width + "px")
            .style("height", d => d.height + "px");

    }

    function sortPointCloudsAsIdxs(sortedIdxs) {
        let sortedPointClouds = [];
        sortedIdxs.forEach(idx => {
            sortedPointClouds.push(pointClouds[idx]);
        });
        pointClouds = sortedPointClouds;
    }

    function updatePointCloudPositions() {
        //Update point clouds position.
        for (let i = 0; i < pointClouds.length; i++) {
            pointClouds[i].position.set(profilePosition.x, profilePosition.y, profilePosition.z + i * elementPlaneStepSize + stepMargin);
        }
        //Update the sphere position
        stepHandle.position.set(profilePosition.x, profilePosition.y, profilePosition.z + (pointClouds.length - 1) * elementPlaneStepSize + stepMargin + stepHandlerMargin);
    }

    function highlightSelectedPointClouds() {
        let selectedElements = selectedPointClouds.map(d => d.name);
        pointClouds.forEach(pc => {
            let fw = (selectedElements.indexOf(pc.name) >= 0) ? 'bold' : 'normal';
            texts[pc.name].style('font-weight', fw);
        });
    }
}

function argSort(arr) {
    let idxs = [];
    for (let i = 0; i < arr.length; i++) {
        idxs.push(i);
    }
    idxs.sort((a, b) => arr[a] - arr[b]);
    return idxs;
}

