$(document).ready(function () {
    $.ajax({
        type: "GET",
        url: "/api/blog/all",
        dataType: "json",
        success: function (result) {
            console.log(result.data);
            createBlogs(result.data);
        }
    });

    function createBlogs(data) {

        data.forEach(function (d) {
            const name = d.name;
            const role = d.role;
            const time = d.time;
            const title = d.title;

            $("#blog-container").append(
                `<div class='col-md-12'>` +
                `<div class='blog-entry ftco-animate d-md-flex fadeInUp ftco-animated'>` +
                `<a href='single.html' class='img img-2' style='background-image: url(\"img/${name}.png\");'></a>` +
                `<div class='text text-2 pl-md-4'>` +
                `<h3 class='mb-2'><a href='single.html'>${title}</a>` +
                `</h3>` +
                `<div class='meta-wrap'>` +
                `<p class='meta'>` +
                `<span><i class='icon-calendar mr-2'></i>June 28, 2019</span>` +
                `<span><a href='single.html'><i class='icon-folder-o mr-2'></i>${name}, ${role}</a></span>` +
                `<span><i class='icon-comment2 mr-2'></i>5 Comment</span>` +
                `</p>` +
                `</div>` +
                `<p class='mb-4'>${title}</p>` +
                `<p><a href='#' class='btn-custom'>Read More <span` +
                `class='ion-ios-arrow-forward'></span></a></p>` +
                `</div>` +
                `</div>` +
                `</div>`
            )
        });
        
        $("#blog-container").append(


        `<div class='col-md-12'><div class='col text-center text-md-left'><div class='block-27'>
            <ul>
                <li><a href='#'>&lt;</a></li>
                <li class='active'><span>1</span></li>
                <li><a href='#'>2</a></li>
                <li><a href='#'>3</a></li>
                <li><a href='#'>4</a></li>
                <li><a href='#'>5</a></li>
                <li><a href='#'>&gt;</a></li>
            </ul>
        </div></div></div>`
        )
    }

    $("#post-blog-btn").click(function () {
        const name = $("#name").val();
        const role = $("#role").val();
        const email = $("#email").val();
        const title = $("#title").val();
        const content = $("#content").val();
        const time = Date.now();

        if (name === "" || role === "" || email === "" || title === "" || content === "") {
            alert("Input fields can't be empty");
        } else {
            const jsonRequest =
                {
                    name: name,
                    role:role,
                    email:email,
                    title:title,
                    content:content,
                    time:time
                };

            $.ajax({
                type: "POST",
                url: "/api/blog/create",
                data: JSON.stringify(jsonRequest),
                success: function (data) {},
                dataType: "json"
            });

            $("#name").val("");
            $("#role").val("");
            $("#email").val("");
            $("#title").val("");
            $("#content").val("");
        }
    })
});