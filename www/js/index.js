/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the
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

    // Initialize database
    appDb.open();
    appDb.createTable();

    //
    // Button handlers
    //

    // Add note button: Save the entry to the entries table (in websql)
    $('#btnAddNote').on("click", function(e){
      var entryText = $("#note").val();
      app.addEntry(entryText);
    });

    // Login button handler
    $("#btnLogin").on("click", function () {
      console.log("Inside login click handler function");
      console.log("Auth is: " + auth);
      auth.init();

      console.log("Calling authentication subroutine");
      auth.googleAuth(app.authSuccess);
    });

    // Edit current memory (the most recently added one)
    $("#editCurrentMemoryBtn").on("click", function (e){
      //$("#currentEntry").textinput("enable");
      $("#currentEntry").focus();
    });

    $("#currentEntry").on("focusout", function (e){
      var text = $("#currentEntry").val();
      if (text.length > 0) {
        appDb.updateEntry(app.last_inserted, text, function () {
          toastr.success("Memory updated");
        });
      }
    });

    // See random button: Show a random entry
    $('#btnSeeRandom').on('click', function(e){
      appDb.getRandomEntry(app.displayRandomEntry);
    });

    // See newer than what is currently displayed
    $("#btnSeeNewer").on("click", function(e) {
      console.log("Currently reading entry id: " + app.last_read);
      appDb.getNext(app.last_read, app.displayRandomEntry);
    });

    // See newer than what is currently displayed
    $("#btnSeeOlder").on("click", function(e) {
      console.log("Currently reading entry id: " + app.last_read);
      appDb.getPrev(app.last_read, app.displayRandomEntry);
    });

    // Backup entries to the cloud
    $('#btnBackup').on('click', function () {
      var passphrase = $("#passphrase").val();
      app.backup(passphrase);
    });

    // Restore entries from the cloud
    $('#btnRestore').on('click', function(e){
      navigator.notification.confirm(
        "This will overwrite all memories on phone. Are you sure?",
        function (buttonIndex) {
          if (buttonIndex === 1) {
            var passphrase = $("#passphrase").val();
            app.restore(passphrase);
          }
        });
    });

    //Mark a memory as important
    $('#starBtn').on('click', function(e){
      if (this.className.indexOf("fa-star-o") > -1) {
        appDb.addMemorable(app.last_inserted);
      } else {
        appDb.removeMemorable(app.last_inserted);
      }
      $(this).toggleClass("fa-star-o");
    });

    // Take a picture using camera, picture is stored in MyLife directory
    $('#cameraBtn').on('click', function(e){
      e.preventDefault();
      app.attachPicture(navigator.camera.PictureSourceType.CAMERA);
    });

    // Attach a picture from the gallery. Warning: The picture is not copied
    // to the MyLife directory, so if the picture is deleted from the gallery
    // the memory entry will be corrupted. Maybe we should make a copy? (TBD)
    $('#galleryBtn').on('click', function(e){
      e.preventDefault();
      app.attachPicture(navigator.camera.PictureSourceType.SAVEDPHOTOALBUM);
    });


    //
    // Page initialization functions
    //

    $(document).on('pageshow', '#main-page', function(){
      app.showMainPage();
    });

    $(document).on('pageshow', '#see-more-page', function(){
      console.log("Showing see-more-page");

      // Update the current memory count 
      appDb.getAllEntries(function (count) {
        $(".totalEntries").text(count + " memories");
      });

      // Fetch a random entry to begin with.
      appDb.getRandomEntry(app.displayRandomEntry);
    });

    //
    // Initial file wrapper object
    //

    appFile.init();

    //
    // It's showtime!!!
    //

    console.log("Show time now!");
    var uid = window.localStorage.getItem("uid");
    if (uid !== null && uid.length > 0) {
      console.log("Found UID is: " + uid);
      app.userName = uid;

      console.log("Will display main page now");
      app.showMainPage();
    } else {
      console.log("UID not found, will display login page!!");
      app.showLoginPage();
    }

    //
    // Run tests
    //


  },
  addEntry: function (entryText) {
    if (entryText.length > 0) {
      appDb.addEntry(entryText, app.switchEntryAddedPage);
      //appDb.getRandomEntry(app.displayRandomEntry);
    } else {
      toastr.warning("Nothing to say? Nothing to save.");
    }
  },
  backup: function (passphrase) {
    if (passphrase.length > 0) {
      app.passphrase = passphrase;
      $("#passphrase").val("");

      toastr.info("Backing up memories, please wait...", {
        "timeOut": "3000"
      });
      appDb.export(passphrase, app.userName, function (){
        toastr.success("Backed up all memories to the cloud successfully.");
      });
    } else {
      toastr.error("Please enter the secret passphrase.");
    }
  },
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
  authSuccess: function (displayName, uid) {
    console.log("Inside authSuccess: displayName is " + displayName);
    console.log("Inside authSuccess: uid is " + uid);

    app.userName = uid;
    console.log("Saving UID to localStorage");
    window.localStorage.setItem("uid", uid);
    // Initialize and display main page

    console.log("Will display main page now!");
    app.showMainPage();
  },
  attachPicture: function (source) {
    console.log("Inside FUNC attach picture: " + source);
    var options = {
      quality: 75,
      targetWidth: 800,
      targetHeight: 800,
      correctOrientation: true,
      destinationType: navigator.camera.DestinationType.FILE_URI,
      encodingType: Camera.EncodingType.JPEG,
      sourceType: source
    };

    navigator.camera.getPicture(
      function(imageUri){
        console.log("Image URI is: " + imageUri);

        // Hack, because of PhoneGap bug https://issues.apache.org/jira/browse/CB-5398
        if (imageUri.substring(0,21)=="content://com.android") {
          console.log("Splitting image URI");
          photo_split = imageUri.split("%3A");
          imageUri = "content://media/external/images/media/"+photo_split[1];
        }

        window.resolveLocalFileSystemURL(imageUri,
          function(origFileEntry) {

            console.log("origFileEntry:" + origFileEntry.name);

            // Prefix the user-Id make it unique when uploaded to the server
            //console.log("origFileEntry-fullpath: " + origFileEntry.fullPath);
            //console.log("imageUri: " + imageUri);
            // appFile.renameFile(origFileEntry.fullPath,
            //   app.userName + "-" + origFileEntry.name,
            //   function (renamedFileEntry) {

            //   // And move it out of the cache directory so it won't get flushed by OS
            //   appFile.moveFile(renamedFileEntry, app.rootDir, function (movedFileEntry) {
            //     appDb.addAttachment(movedFileEntry.toURL(), app.last_inserted);
            //     $("#currentEntryImgID").attr("src", movedFileEntry.toURL());
            //   });
            // });

            var newName = app.userName + "-" + origFileEntry.name;
            console.log("New name is: " + newName);
            appFile.moveFile2(origFileEntry, app.rootDir, newName, function (movedFileEntry) {
              appDb.addAttachment(movedFileEntry.toURL(), app.last_inserted);
              $("#currentEntryImgID").attr("src", movedFileEntry.toURL());
            });
          },
          null
        );
      },
      function(message){
        console.log("cancelled: " + message);
        toastr.warning(message + " Please make sure that selected file is an image");
      },
      options);
  },
  showLoginPage: function () {
    $.mobile.changePage("#login-page");
  },
  showMainPage: function () {
    $("#note").val("");
      
    // Read a random entry back from the entries table
    console.log("Getting random entry");
    appDb.getRandomEntry(app.displayRandomEntry);

    //Display the last received quote from the server
    console.log("Checking Window.localStorage for quotes: " + window.localStorage);
    var quote = window.localStorage.getItem("quote");

    // Just in case the server sent us garbage data (undefined string)
    if ( (quote !== null) && (quote !== "undefined") ) {
      $("#randomQuote").text(quote);
    }

    console.log("Switching to main page NOW!");
    $.mobile.changePage("#main-page");
  },
  switchEntryAddedPage: function (lastEntryId, entryText) {
    console.log("Last entry ID: " + lastEntryId);
    app.last_inserted = lastEntryId;
    $("#note").val(""); //not needed
    $("#randomEntryImgID").attr("src", ""); //not needed

    console.log("Setting the new text to: " + entryText);
    $("#currentEntry").val(entryText);

    console.log("Changing current Img to null");
    $("#currentEntryImgID").attr("src", "");

    console.log("Calculating number of entries...");
    appDb.getAllEntries(function (count) {
      console.log("There are now " + count + "memories");
      $(".totalEntries").text(count + " memories");
    });

    $.mobile.changePage("#entry-added-page");
    toastr.success("Entry added.");
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
  displayRandomEntry: function (row) {
    if (row !== null) {

      console.log("Entry date: " + row.added_on);
      console.log("Row entry: " + row.entry);

      // Let's save this ID. This is needed for displaying newer, and older entries
      app.last_read = row.ID;
      
      // To clear an img, it's not enough to set src to ""!
      $(".randomEntryImgID").hide();
      $(".entry-date").text("");
      $(".randomEntry").text("");

      $("#starBtnRdOnly").addClass("fa-star-o fa-star");
      
      // Update the UI  
      $(".entry-date").text($.timeago(row.added_on));
      $(".randomEntry").text(row.entry);
      $(".label-past").text("Something you wrote");

      // Does the entry have any attachments? Display them!
      console.log("Looking for attachments for entry ID: " + row.ID);
      appDb.getAttachmentsByEntryId(app.displayAttachments, row.ID);

      // Is this a memorable entry?
      console.log("Checking if this entry is memorable...");
      appDb.isEntryMemorable(app.displayMemorable, row.ID);
    } else {
      console.log("No memories found"); //should never happen
    }
  },
  displayMemorable: function (isMemorable) {
    console.log("isMemorable is: " + isMemorable);
    if (isMemorable === true) {
      $("#starBtnRdOnly").toggleClass("fa-star-o");
    }
  },
  displayAttachments: function (attachmentRows) {
    // Clear out old one
    console.log("Inside displayAttachments, rows retd: " + attachmentRows.length);

    // For now, just display the last added attachment
    if (attachmentRows.length > 0) {
      console.log("Number of attachments: " + attachmentRows.length);
      var lastAttachmentIndex = attachmentRows.length - 1;
      var attachmentRow = attachmentRows.item(lastAttachmentIndex);
      $(".randomEntryImgID").attr("src", attachmentRow.path);
      $(".randomEntryImgID").show();
    }
    //for (var i = 0; i < attachmentRows.length; ++i) {
      //var attachmentRow = attachmentRows.item(i);
      // For now, limiting to one display only. Should be easy to display more
      // without changing the db schema.
      //$(".randomEntryImgID").attr("src", attachmentRow.path);
      //console.log("PATHPATH: " + row.path);
    //}
  },
  fsFail: function (error) {
    console.log("Inside fsFail, error code is: " + error.code);
    util.printError("File operation failed", error);
  },
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
