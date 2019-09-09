// function getstring(str){
//     return str.trim()===""?null:str;
// }
// $.ajax({
//   type: 'GET',
//   // url: 'https://cors-anywhere.herokuapp.com/http://appcollab.ads.ttu.edu/TxRPDB/Admin/Search.aspx',
//   url: 'http://appcollab.ads.ttu.edu/TxRPDB/Account/Login.aspx',
//   // url: 'https://cors-anywhere.herokuapp.com/http://appcollab.ads.ttu.edu/TxRPDB/Account/Login.aspx?authantication=true',
//   // beforeSend: function(request) {
//   //   request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
//   //   request.setRequestHeader('Cache-Control', 'max-age=0');
//   // },
//   // context: document.body,
//   // crossDomain: true,
//   // data:'__EVENTTARGET=&__EVENTARGUMENT=&__VIEWSTATE=w3I6PsvmW5kaWUBF8%2FDegeEmqchcWekQl7kEdUaSQFnZvXbnqehjvmQxpiegWBrw39nHxIO35W3EZaPQFwBu9bt9%2FMbRlAIniLhWpc5Tm3E%3D&__VIEWSTATEGENERATOR=DA7F3EE2&__EVENTVALIDATION=u6GVeJuOiqjwmpFbT1GuHw00tR%2FoARFATF39GELWsqwZ4gIjZb1HEWzAoHKXqQZjdvjmEUub0UpFzv4JeaeSwn7pktqEZ11lBs6FqgzEKR68esD28I3NbwySy8%2BlBRDT%2B79vt5aRVuibDUrXl7kiqtpqjfHsoDMTrgG%2BWJdoahepungtkyaERVbr87XaoC1ACdB1sTHBxkEW3MByJWGJZQ%3D%3D&ctl00%24MainContent%24txtLogin=mwon&ctl00%24MainContent%24txtPassword=texastech&ctl00%24MainContent%24btnLogin=Login',
//   dataType:'html',
//   success:  function( htmldata ) {
//       $( '#hiddenContent').append(handlelink(htmldata,'Account'));
//
//       $('form').removeAttr('onsubmit');
//       $('#MainContent_btnLogin').on('click',function ( ) {console.log('click')});
//
//       $('form').submit(function( event ) {
//
//           // event.preventDefault(event);
//           $.ajax({
//               type: 'POST',
//               url: 'http://appcollab.ads.ttu.edu/TxRPDB/Admin/UpdateSectionData.aspx',
//               data: $(event.currentTarget).serialize(),
//               success: function (htmldata) {
//                   $('#hiddenContent').empty();
//                   let newcontent = document.createElement('html');
//                   newcontent.innerHTML = handlelink(htmldata, 'Admin');
//                   // newcontent.querySelectorAll('script').forEach(n=>
//                   //         $('#hiddenContent').append(n)
//                   // );
//                   // $( '#hiddenContent').append(newcontent.querySelector('header').querySelectorAll('*'));
//                   // $( '#hiddenContent').append(newcontent.querySelector('body').querySelectorAll('*'));
//                   $('#hiddenContent').append(handlelink(htmldata, 'Admin'));
//                   // $('#hiddenContent').append(newcontent.querySelectorAll('form'));
//                   $('form').removeAttr('onsubmit');
//                   theForm.onsubmit = null;
//                   // theForm.onsubmit() = null;
//                   // var fields = ['District', 'Highway', 'NoOfLanes', 'Thickness', 'PavementType', 'ShoulderType', 'ConcreteCAT', 'Drainage', 'VerticalAlign', 'HorizontalAlign'];
//                   // fields.forEach(n =>
//                   //     $('#MainContent_hField' + n + 'Value').val('Select')
//                   // )
//                   // $('input#MainContent_hdFieldDistrictValue').val('Abilene, Amarillo, Atlanta, Austin, Beaumont, Bryan, Childress, Dallas, El Paso, Ft Worth, Ft. Worth, Houston, Laredo, Lubbock, Lufkin, Odessa, Paris, San Angelo, San Antonio, Tayler, Tyler, Waco, Wichita Falls, Yoakum');
//                   // $('#MainContent_ddListDistrictValue option').attr('aria-selected','true')
//                   $('form').submit(function (event) {
//                       console.log(event);
//                       event.preventDefault(event);
//                       // if (WebForm_OnSubmit())
//                       //   searchSquen(event);
//                       return false;
//                   });
//
//                   if  ($('td[colspan="8"] table td:last-child a')){
//                       __doPostBack('ctl00$MainContent$grdSearch','Page$'+count);
//                       count++;
//                   }
//
//               }
//
//
//           });
//           return false;
//       });
//   },
//   error: function (data) {
//     alert("In error  ");
//
//   }
// });

function searchItem(SectionID) {
    $.ajax({
        type: 'POST',
        url: 'http://appcollab.ads.ttu.edu/TxRPDB/SectionDataView.aspx?SectionID='+SectionID,
        // data: $(event.currentTarget).serialize(),
        success: function( htmldata ) {
            $( '#hiddenContent').empty();
            $( '#hiddenContent').append(handlelink(htmldata,'Admin'));
            document.querySelectorAll('table tr span[id]').forEach(d=>{
                basedata[SectionID][d.id.replace('lbl','')] = getstring(d.textContent);
            });
        },
        error: function (data) {
            alert("In error  ");

        }
    })
    ;
}


function searchSquen(event) {
    $.ajax({
        type: 'POST',
        url: 'http://appcollab.ads.ttu.edu/TxRPDB/Admin/UpdateSectionData.aspx',
        data: $(event.currentTarget).serialize(),
        success: function( htmldata ) {
            $( '#hiddenContent').empty();
            $( '#hiddenContent').append(handlelink(htmldata,'Admin'));
            $('form').removeAttr('onsubmit');
            $('form').submit(function (event) {
                console.log( $(event.currentTarget).serialize());
                event.preventDefault(event);
                // if (WebForm_OnSubmit())
                searchSquen(event);
                return false;
            });
            if  ($('td[colspan="8"] table td:last-child a')){
                __doPostBack('ctl00$MainContent$grdSearch','Page$'+count);
                count++;
            }
        },
        error: function (data) {
            alert("In error  ");

        }
    })
    ;
}
function handlelink(htmldata,prepath){
    return htmldata.replace(/src="\/TxRPDB\//g,'src="http://appcollab.ads.ttu.edu/TxRPDB/')
    // .replace(/..\//g,'http://appcollab.ads.ttu.edu/TxRPDB/')
    //   .replace(/..\/(\w+)/gi,'http://appcollab.ads.ttu.edu/TxRPDB/$1')
        .replace(/..\/Styles\//g,'http://appcollab.ads.ttu.edu/TxRPDB/Styles/')
        .replace(/..\/SearchControls\//g,'http://appcollab.ads.ttu.edu/TxRPDB/SearchControls/')
        .replace(/src="SearchControls\//g,'src="http://appcollab.ads.ttu.edu/TxRPDB/Admin/')
        .replace(/\/TxRPDB\/Admin\/wdstyles/g,'http://appcollab.ads.ttu.edu/TxRPDB/Admin/wdstyles')
        .replace(/action=".\//g,'action="http://appcollab.ads.ttu.edu/TxRPDB/'+prepath+'/')
}
// hacking zone
$('#dummycontent').on('load',function(){
    // // we can get the reference to the inner window
    // let iframeWindow = dummycontent.contentWindow; // OK
    // try {
    //   // ...but not to the document inside it
    //   let doc = dummycontent.contentDocument; // ERROR
    // } catch(e) {
    //   alert(e); // Security Error (another origin)
    // }
    //
    // // also we can't READ the URL of the page in iframe
    // try {
    //   // Can't read URL from the Location object
    //   let href = dummycontent.contentWindow.location.href; // ERROR
    // } catch(e) {
    //   alert(e); // Security Error
    // }
    // $('#dummycontent').contentWindow.location = '/';
    // $('#dummycontent').on('load',null);
    console.log('login success!!');
});
