var ajax = {
  error: function (xhr, textStatus, exception) {
    console.log("xhr status: " + xhr.status);
    toastr.error("xhr status: " + xhr.status);
    if (xhr.status === 0) {
        console.log('Not connect. Verify Network.');
    } else if (xhr.status == 404) {
        console.log('Requested page not found. [404]');
    } else if (xhr.status == 500) {
        console.log('Internal Server Error [500].');
    } else if (exception === 'parsererror') {
        console.log('Requested JSON parse failed.');
    } else if (exception === 'timeout') {
        console.log('Time out error.');
    } else if (exception === 'abort') {
        console.log('Ajax request aborted.');
    } else {
        console.log('Uncaught Error.\n' + xhr.responseText);
    }
  },
  sendToWeb: function (memoryObj) {

    memoryObj["userId"] = app.userName;

    $.ajax({
      type: "POST",
      url: "http://mylife-web.azurewebsites.net/add",
      data: memoryObj,
      dataType: "json",
      crossDomain: true,
      beforeSend: function () {console.log("posting memory...");},
      success: function (data) {
        console.log("Posted the memory to azure cloud");
      },
      error: ajax.error
    });
  }
};