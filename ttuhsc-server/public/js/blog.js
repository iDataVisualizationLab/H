let user = {};

$(document).ready(function () {
    $('#blog-create-container').load("/api/blog-create-container");

    $.ajax({
        type: "GET",
        url: "/api/blog/all",
        dataType: "json",
        success: function (result) {
            createBlogs(result.data);
        }
    });

    function createBlogs(data) {

        data.forEach(function (d) {
            const id = d._id;
            const name = d.name;
            const role = d.role;
            const time = d.time;
            const title = d.title;

            $("#blog-container").append(
                `<div class='col-md-12'>` +
                `<div class='blog-entry ftco-animate fadeInUp ftco-animated'>` +
                `<div class="row col-12">` +
                `<a href='single.html' class='img img-2' style='background-image: url(\"img/${name}.png\");'></a>` +
                `<div class='text text-2 pl-md-4'>` +
                `<h3 class='mb-2'><a href='single.html'>${name}, ${role}</a></h3>` +
                `<div class='meta-wrap'>` +
                `<p class='meta'>` +
                `<span><i class='icon-calendar mr-2'></i>June 28, 2019</span>` +
                `<span><i class='icon-comment2 mr-2'></i>5 Comment</span>` +
                `</p>` +
                `</div>` +
                `</div>` +
                `</div>` +
                `<div class="row col-12 blog-content">` +
                `<p class='mb-4'>${title}</p><p class="blog-content-img"><img src="img/${name}.png"></p>` +
                `</div>` +
                `<hr class="horizontal-line">` +
                `<div class="row col-12 form-group form-inline create-comment-form" id="blog_${id}">` +
                `</div>` +
                `<hr class="horizontal-line">` +
                `<div class="blog-comment">` +
                `<div class="col-12 form-group form-inline">` +
                `<a href='single.html' class='img img-2' style='background-image: url(\"img/user_male.png\");'></a>` +
                `<p class="col-10 comment-content" id="name"><strong style="color: #3e5993">Hao Van</strong> This is the second demo comment This is the second demo comment This is the second demo comment This is the second demo comment</p>` +
                `</div>` +
                `<div class="col-12 form-group form-inline">` +
                `<a href='single.html' class='img img-2' style='background-image: url(\"img/user_male.png\");'></a>` +
                `<p class="col-10 comment-content" id="name"><strong style="color: #3e5993">Hao Van</strong> This is the second demo comment</p>` +
                `</div>` +
                `<div class="col-12 form-group form-inline">` +
                `<a href='single.html' class='img img-2' style='background-image: url(\"img/user_male.png\");'></a>` +
                `<p class="col-10 comment-content" id="name"><strong style="color: #3e5993">Hao Van</strong> This is the second demo comment</p>` +
                `</div>` +
                `</div>` +
                `</div>` +
                `</div>`
            );
        });

        $('.create-comment-form').load('/api/create-comment-form');



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
                    role: role,
                    email: email,
                    title: title,
                    content: content,
                    time: time
                };

            $.ajax({
                type: "POST",
                url: "/api/blog/create",
                data: JSON.stringify(jsonRequest),
                success: function (data) {
                },
                dataType: "json"
            });

            $("#name").val("");
            $("#role").val("");
            $("#email").val("");
            $("#title").val("");
            $("#content").val("");
        }
    });

    $('#signin').click(function () {
        var email = $('#email').val();
        var password = $('#password').val();

        $.ajax({
            type: 'POST',
            url: "api/signin",
            dataType: 'json',
            data: {email: email, password: password},
            success: function (data) {
            },
            statusCode: {
                200: function () {
                    $('#blog-create-container').load("/api/blog-create-container");
                    $('.create-comment-form').load('/api/create-comment-form');
                    updateUser()
                },
                401: function () {
                    $('#signInFail').modal('show');
                }
            }
        })
    });

    $('#closeFailNoti').click(function () {
        $('#signInModal').modal('show');
    });

});

function keyEvent(current, e) {
    var key = e.which;
    var blogId = current.parentNode.getAttribute('id').split('_')[1];
    if (key === 13) {
        var commentContent = $(current).val();
        updateUser();
        $.ajax({
            type: 'POST',
            url: 'api/comment/create',
            dataType: 'json',
            data: {blogId: blogId, content: commentContent, owner: user.email},
            success: function (data) {
            },
            statusCode: {
                200: function () {
                    $(current).val('')
                }
            }
        })
    }
}

function updateUser() {
    $.ajax({
        type: 'GET',
        url: 'api/user',
        success: function (data) {
            user = data;
        }
    })
}
