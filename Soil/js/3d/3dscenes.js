let ThreeDScences = function(renderer, profileSize){
    this.setupElementScene1 = setupElementScene1;
    this.setupElementScene2 = setupElementScene2;
    this.renderSceneInfo = renderSceneInfo;
    this.renderScene = renderScene;

    function setupElementScene1(pointCloud, elementInfo1) {
        return setupElementScene(pointCloud, 'detailChart1', elementInfo1);
    }

    function setupElementScene2(pointCloud, elementInfo2) {
        return setupElementScene(pointCloud, 'detailChart2', elementInfo2);
    }

    function makeScene(elem) {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(1, 1, 1);

        let width = profileSize.x;
        let height = profileSize.y;
        const camera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 0.1, 100);
        camera.position.set(0, 0, 3);

        camera.lookAt(0, 0, 0);
        {
            let aLight = new THREE.AmbientLight(new THREE.Color(0.7, 0.7, 0.7), 1.0);
            scene.add(aLight);
        }

        return {scene, camera, elem};
    }

    function setupElementScene(pointCloud, elementId, sceneInfo) {
        //Set the text
        // d3.select(`#${elementId}`).select('.elementText').text(pointCloud.name);
        //Also highlight color at its border.
        // highlightPointCloudBorder(pointCloud);

        pointCloud = pointCloud.clone();
        pointCloud.material = pointCloud.material.clone();
        pointCloud.material.size = 3;
        if (!sceneInfo) {
            sceneInfo = makeScene(document.querySelector(`#${elementId}`));
        }

        if (sceneInfo.mesh) {
            sceneInfo.scene.remove(sceneInfo.mesh);
        }
        if (pointCloud) {
            pointCloud.position.set(0, 0, 0);
            sceneInfo.scene.add(pointCloud);
            sceneInfo.mesh = pointCloud;
        }
        return sceneInfo;
    }

    function renderSceneInfo(sceneInfo) {
        const {scene, camera, elem} = sceneInfo;
        renderScene(scene, camera, elem);
    }

    function renderScene(scene, camera, elem) {
        // Get the viewport relative position of this element
        const {left, right, top, bottom, width, height} = elem.getBoundingClientRect();
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        const positiveYUpBottom = window.innerHeight - bottom;
        renderer.setScissor(left, positiveYUpBottom, width, height);
        renderer.setViewport(left, positiveYUpBottom, width, height);
        renderer.render(scene, camera);
    }
}
