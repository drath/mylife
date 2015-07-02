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
 * under the License.
 */
var app = {

  regUrl: "",
  userName: "drath",
  last_inserted: null,

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

    // Because they are annoying 
    $.mobile.defaultPageTransition = "none";

    // Avoid the 300ms tap delay
    FastClick.attach(document.body);

    // Read secret data from config file. The config file is not in github.
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

    // Create websql table if it does not exist
    appDb.open();
    appDb.createTable();

    // Initialize and display main page
    app.showMainPage();

    //
    // Button handlers
    //

    // Add note button: Save the entry to the entries table (in websql)
    $('#btnAddNote').on('click', function(e){
      var entryText = $("#note").val();
      if (entryText.length > 0) {
        appDb.addEntry(entryText, app.switchEntryAddedPage);
        appDb.getRandomEntry(app.displayRandomEntry);
      } else {
        alert("Nothing to say? Nothing to save.");
      }
    });

    // See random button: Show a random entry
    $('#btnSeeRandom').on('click', function(e){
      appDb.getRandomEntry(app.displayRandomEntry);
    });

    $('#btnBackup').on('click', function(e){
      appDb.export();
    });

    $('#btnRestore').on('click', function(e){
      appDb.import();
    });


    //
    // Page initialization functions
    //

    $(document).on('pageshow', '#main-page', function(){
      app.showMainPage();
    });

    $(document).on('pageshow', '#see-more-page', function(){
      console.log("Showing see-more-page");
      appDb.getRandomEntry(app.displayRandomEntry);
    });
      
    //
    // Button Handlers
    //

    // Take a picture using camera, picture is stored in MyLife directory

    $('#cameraBtn').on('click', function(e){
      console.log("You clicked camera buttton");
      e.preventDefault();
      app.attachPicture(navigator.camera.PictureSourceType.CAMERA);
    });

    // Attach a picture from the gallery. Warning: The picture is not copied
    // to the MyLife directory, so if the picture is deleted from the gallery
    // the memory entry will be corrupted. Maybe we should make a copy? (TBD)

    $('#galleryBtn').on('click', function(e){
      console.log("You clicked gallery buttton");
      e.preventDefault();
      app.attachPicture(navigator.camera.PictureSourceType.PHOTOLIBRARY);
    });

  },
  attachPicture: function (source) {
    var options = {
      quality: 75,
      correctOrientation: true,
      destinationType: navigator.camera.DestinationType.FILE_URI,
      encodingType: Camera.EncodingType.JPEG,
      sourceType: source
    };

    navigator.camera.getPicture(
      function(imageUri){
        window.resolveLocalFileSystemURI(imageUri,
          function(fileEntry) {
            var uri = fileEntry.toURI();
            appDb.addAttachment(uri, app.last_inserted);
            $("#currentEntryImgID").attr("src", uri);
          },
          null);
      },
      function(message){
        console.log("cancelled: " + message);
        alert(message + " Please make sure that selected file is an image");
      },
      options
    );
  },
  showMainPage: function () {
    $("#note").val("");
      
    // Read a random entry back from the entries table
    appDb.getRandomEntry(app.displayRandomEntry);

    //Display the last received quote from the server
    console.log("Window.localStorage: " + window.localStorage);
    var quote = window.localStorage.getItem("quote");
    if (quote !== null) {
      $("#randomQuote").text(quote);
    }
  },
  switchEntryAddedPage: function (lastEntryId, entryText) {
    console.log("Last entry ID: " + lastEntryId);
    app.last_inserted = lastEntryId;
    $("#note").val(""); //not needed
    $("#randomEntryImgID").attr("src", ""); //not needed
    $("#currentEntry").text(entryText);

    console.log("Changing current Img to null");
    $("#currentEntryImgID").attr("src", "");

    $.mobile.changePage("#entry-added-page");
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
  displayRandomEntry: function (row, totalRows) {
    if (row !== null) {

      console.log("Entry date: " + row.added_on);
      console.log("Total entries: " + totalRows);
      
      // To clear an img, it's not enough to set src to ""!
      $(".randomEntryImgID").hide();
      $(".entry-date").text("");
      $(".randomEntry").text("");
      $(".totalEntries").text("");
      
      // Update the UI  
      $(".entry-date").text($.timeago(row.added_on));
      $(".randomEntry").text(row.entry);
      $(".label-past").text("Something you wrote");
      $(".totalEntries").text(totalRows + " memories");

      // Does the entry have any attachments? Display them!
      console.log("Looking for attachments for entry ID: " + row.ID);
      appDb.getAttachmentsByEntryId(app.displayAttachments, row.ID);
    } else {
      console.log("No memories found"); //should never happen
    }
  },
  displayAttachments: function (attachmentRows) {
    // Clear out old one
    console.log("Inside displayAttachments, rows retd: " + attachmentRows.length);

    // For now, just display the first attachment
    if (attachmentRows.length > 0) {
      var attachmentRow = attachmentRows.item(0);
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

                  $.ajax({
                      type: 'POST',
                      url: app.regUrl,
                      data: e.regid,
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
