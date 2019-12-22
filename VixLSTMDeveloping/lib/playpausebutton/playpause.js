function createButton(containerId, clickAction) {
    let btn = document.getElementById("trainingButtonContainer");
    btn.addEventListener("click", function () {
        $("#trainingButtonContainer").unbind('click');
        if (this.classList.contains("paused")) {
            clickAction("start");
            btn.innerHTML = 'start';
            this.classList.remove("paused");
        } else {
            clickAction("pause");
            btn.innerHTML = 'pause';
            this.classList.add("paused");
        }
    });
    return btn;
}