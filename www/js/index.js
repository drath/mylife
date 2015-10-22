/*
 * Main file
 * (c) Devendra Rath, 2015
 */
var app = {

  regUrl: "",
  userName: "",
  passphrase: "",
  rootDir: "mylife_pictures",
  last_inserted: null,
  last_read: null,

  // Application Constructor

  initialize: function() {
      this.bindEvents();
  },

  // Bind Event Listeners, typically 'load', 'deviceready', 'offline', and 'online'

  bindEvents: function() {
      document.addEventListener('deviceready', this.onDeviceReady, false);
  },

  // deviceready Event Handler

  onDeviceReady: function() {
      app.receivedEvent('deviceready');
  },

  // Update DOM on a Received Event

  receivedEvent: function(id) {

    console.log("jQuery version: " + jQuery.fn.jquery);

    // Toast options
    toastr.options = {
      "closeButton": false,
      "debug": false,
      "newestOnTop": false,
      "progressBar": false,
      "positionClass": "toast-bottom-center",
      "preventDuplicates": false,
      "onclick": null,
      "showDuration": "300",
      "hideDuration": "1000",
      "timeOut": "5000",
      "extendedTimeOut": "1000",
      "showEasing": "swing",
      "hideEasing": "linear",
      "showMethod": "fadeIn",
      "hideMethod": "fadeOut"
    };

    // Because they are annoying 
    $.mobile.defaultPageTransition = "none";

    // Avoid the 300ms tap delay
    FastClick.attach(document.body);

    // Read secret data from config file and register with GCM
    jQuery.getJSON("config.json", function(data){

      console.log("Reading configuration file");
      app.regUrl = data.registration.url;
      console.log("Sender ID is: " + data.registration.senderId);
      console.log("Registration URL is: " + data.registration.url);

      /* Register with GCM. Note that we have to do this every time we start up. */
      /* http://stackoverflow.com/questions/21138105/handling-push-notification-message-in-android-phonegap-app */
      console.log("Starting registration process...");
      app.registerGCM(data.registration.senderId);

    });

    // Init the auth component

    auth.init();

    // Initialize database
    appDb.open();
    appDb.createTable();

    //
    // Button handlers
    //

    // Login button handler
    $("#btnLogin").on("click", function () {
      console.log("Inside login click handler function");
      console.log("Calling authentication subroutine");
      auth.googleAuth(app.authSuccess);
    });

    // Backup entries to the cloud

    $('#btnBackup').on('click', function () {
      //var passphrase = $("#passphrase").val();
      app.backup();
    });

    //
    // Initialize pages
    //

    page_thankyou.init();
    page_home.init();
    page_seemore.init();

    //
    // Initial file wrapper object
    //

    appFile.init();

    //
    // It's showtime!!!
    //

    console.log("Show time now!");

    //

    var uid = window.localStorage.getItem("uid");
    if (uid !== null && uid.length > 0) {
      console.log("Found UID is: " + uid);
      app.userName = uid;
      console.log("Will display main page now");

      page_home.display();
      
    } else {
      console.log("UID not found, will display login page!!");
      //app.showLoginPage();
      $.mobile.changePage("#login-page");
    }

    //
    // Run tests
    //


  },

  //
  // TBD: This function will be removed once the migration is complete
  //

  backup: function () {

    toastr.info("Backing up memories...", {
      "timeOut": "3000"
    });

    // Now post all the entries to the web

    appDb.getAllEntries(function (rows) {

      for (var i = 0; i < rows.length; ++i) {

        var row = rows.item(i);
        console.log("Row entry is: " + row.entry);

        // We want to send id, entry and when it was added

        var memoryObj = {};
        memoryObj["remoteId"] = row.ID;
        memoryObj["entry"] = sjcl.encrypt("passphrase", row.entry);
        memoryObj["addedOn"] = row.added_on;

        // Get attachments and send

        app.sendWithAttachmentData(row.ID, memoryObj);

      }
    });

  },

  //
  // For this memory, get the last attachment
  //

  sendWithAttachmentData: function (id, memoryObj) {

      appDb.getLastAttachmentByEntryId(id, function (attachments) {

      if (attachments.length > 0) {

        // Need a fileEntry object from the path

        window.resolveLocalFileSystemURL(attachments.item(0).path,

          function(fileEntry) {

            // Get a reader

            fileEntry.file(function (readable) {
              
              var reader = new FileReader();

              reader.onloadend = function (evt) {

                // We have data

                var dataURL = evt.target.result;

                // Add the binary data to the payload

                memoryObj["img"] = dataURL;

                // And send to the server

                ajax.sendToWeb(memoryObj);

                toastr.success("Sending memory to web, please wait...");
                
              };

            // Start reading! 

            reader.readAsDataURL(readable);

            }, app.fsFail);

          }, appDb.failFile);

      } else {

        console.log("No attachments found, just send this plain entry");
        ajax.sendToWeb(memoryObj);
      }
    }, id);

  },

  //
  // TBD: This function needs to be re-written to work with the new server
  //

  restore: function (passphrase) {
    if (passphrase.length > 0) {
      app.passphrase = passphrase;
      $("#passphrase").val("");

      toastr.info("Restoring memories, please wait...", {
        "timeOut": "3000"
      });

      fileTransfer.download(app.userName + ".sql", function () {
        appDb.import(passphrase, app.userName, app.onImportSuccess);
      });
    } else {
      toastr.error("Please enter the secret passphrase.");
    }
  },

  //
  // FIXME: Remove this function
  //

  onImportSuccess: function (count) {
    
    // FIXME: This message is technically incorrect since we have
    // not yet restored the attachments
    toastr.success("Restored all memories from cloud backup.");

    //
    // Now, lets import all the attachments
    //

    appDb.getAllAttachments(function (rows) {
      for(var i = 0; i < rows.length; ++i) {
        var fileName = util.getNameFromPath(rows.item(i).path);
        fileTransfer.download(fileName, function (entry) {
          appFile.moveFile(entry, app.rootDir, function () {
            console.log("Replaced attachment: " + entry.name);
          });
        });
      }
    });

  },

  //
  // FIXME: Can this be moved to the auth module?
  //

  authSuccess: function (displayName, uid) {
    console.log("Inside authSuccess: displayName is " + displayName);
    console.log("Inside authSuccess: uid is " + uid);

    app.userName = uid;
    console.log("Saving UID to localStorage");
    window.localStorage.setItem("uid", uid);
    // Initialize and display main page

    console.log("Will display main page now!");
    //app.showMainPage();
    $.mobile.changePage("#main-page");
  },
  displayAllEntries: function (tx, rs) {
    var rowOutput = "";
    var entries = document.getElementById("entries");
    for (var i=0; i < rs.rows.length; i++) {
      rowOutput += app.renderEntry(rs.rows.item(i));
    }

    entries.innerHTML = rowOutput;
  },
  renderEntry: function (row) {
    return "<li>" + row.entry +
     " [<a href='javascript:void(0);' onclick=\'html5rocks.webdb.deleteTodo(" +
     row.ID +");\'>Delete</a>]</li>";
  },
  getLastAttachment: function (attachmentRows, cbfn) {
    // Clear out old one
    console.log("Inside displayAttachments, rows retd: " + attachmentRows.length);

    // For now, just display the last added attachment
    if (attachmentRows.length > 0) {
      console.log("Number of attachments: " + attachmentRows.length);
      var lastAttachmentIndex = attachmentRows.length - 1;
      var attachmentRow = attachmentRows.item(lastAttachmentIndex);
      
      cbfn(attachmentRow.path); //attachmentRow is a Uri to the attachment

    }
  },
  fsFail: function (error) {
    toastr.warn("Internal error occurred: " + error.code);
    util.printError("File operation failed", error);
  },

  //
  // Register for Google cloud notifications
  //

  registerGCM: function (senderId) {
    var pushNotification = window.plugins.pushNotification;
    pushNotification.register(function () {
                                console.log("Registration request sent");
                              },
                              function () {
                                alert("registration failed!");
                              },
                              {
                                "senderID": senderId,
                                "ecb":"app.onNotificationGCM"
                              });
  },

  //
  // Handles callbacks from Google cloud (for notifications)
  //

  onNotificationGCM: function(e) {
      //alert("inside onNotificationGCM");
      switch( e.event )
      {
          case 'registered':
              if ( e.regid.length > 0 )
              {
                  console.log('Received registration id = '+e.regid);
                  console.log("Sending to: " + app.regUrl);

                  // Get the timezone offset
                  navigator.globalization.getDatePattern(
                    function (date) {
                      console.log("Timezone is: " + date.timezone);
                      console.log("utc_offset in secs is: " + date.utc_offset);

                      //Send offset and registration ID to server
                      var dataObj = {
                        regID: e.regid,
                        utc_offset: date.utc_offset
                      };

                      $.ajax({
                          type: 'POST',
                          url: app.regUrl,
                          //data: e.regid,
                          data: dataObj,
                          crossDomain: true,
                          beforeSend: function () {console.log("senging...");},
                          success: function (data) {
                            console.log("Sent registration ID to mylife server!");
                          },
                          error: function (xhr, textStatus, exception) {
                            console.log("xhr status: " + xhr.status);
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
                      });
                    },
                    function (error) {
                      toastr.warning("Error getting getDatePattern: " + error.message);
                    }
                  );
              }
          break;

          case 'message':
            // this is the actual push notification. its format depends on the data model from the push server
            console.log('message = '+e.message+' msgcnt = '+e.msgcnt);
            console.log('message = '+ e.soundname);
            $("#randomQuote").text(e.soundname);

            // Till we get the next quote, let's save this on in localStorage
            window.localStorage.setItem("quote", e.soundname);

            // console.log("Received a message from mylife server" + e.quote);
          break;

          case 'error':
            alert('GCM error = '+e.msg);
          break;

          default:
            alert('An unknown GCM event has occurred');
            break;
      }
  }
};
