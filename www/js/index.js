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

    $("#note").val("");
    // Read a random entry back from the entries table
    appDb.getRandomEntry(app.displayRandomEntry);

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



    //
    // Page initialization functions
    //

    $(document).on('pageshow', '#main-page', function(){
      $("#note").val("");
      // Read a random entry back from the entries table
      appDb.getRandomEntry(app.displayRandomEntry);
    });

    $(document).on('pageshow', '#see-more-page', function(){
      console.log("Showing see-more-page");
      appDb.getRandomEntry(app.displayRandomEntry);
    });


    $('#cameraBtn').on('click', function(e){
      e.preventDefault();
      var options = {
        quality: 75,
        correctOrientation: true,
        destinationType: navigator.camera.DestinationType.FILE_URI,
        encodingType: Camera.EncodingType.JPEG,
        sourceType: navigator.camera.PictureSourceType.CAMERA
      };

      navigator.camera.getPicture(
        function(imageUri){
          window.resolveLocalFileSystemURI(imageUri, 
            function(fileEntry) {
              console.log("Attaching image to: " + app.last_inserted);
              appDb.addAttachment(fileEntry.toURI(), app.last_inserted);
              $("#currentEntryImgID").attr("src", fileEntry.toURI());
            }, 
            null); 
        },
        function(message){
          console.log("cancelled");
        },
        options
      );


    });

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
  displayRandomEntry: function (row) {
    if (row != null) {

      console.log("Entry date: " + row.added_on);
      
      // To clear an img, it's not enough to set src to ""!
      $(".randomEntryImgID").hide();
      $(".entry-date").text("");
      $(".randomEntry").text("");
      
      // Update the UI  
      $(".entry-date").text($.timeago(row.added_on));
      $(".randomEntry").text(row.entry);
      $(".label-past").text("Something you wrote");

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
                  //console.log('Received registration id = '+e.regid);
                  $.ajax({
                      type: 'POST',
                      url: app.regUrl,
                      data: e.regid,
                      success: function (data) {
                        console.log("Sent registration ID to mylife server!");
                      },
                      error: function (xhr, status, error) {
                        console.log('Error sending registration ID status: ' + 
                                    status + " " + xhr.statusText + " " + error);
                      },
                  });
              }
          break;

          case 'message':
            // this is the actual push notification. its format depends on the data model from the push server
            console.log('message = '+e.message+' msgcnt = '+e.msgcnt);
            console.log('message = '+ e.soundname);
            $("#randomQuote").text(e.soundname);
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
