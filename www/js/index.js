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

    // Read a random entry back from the entries table
    appDb.getRandomEntry(app.displayRandomEntry);

    // Persist the entry to the entries table (in websql)
    $('#btnAddNote').on('click', function(e){
      var entryText = $("#note").val();
      if (entryText.length > 0) {
        appDb.addEntry(entryText);
        $.mobile.changePage("#entry-added-page");
        $("#note").val("");
        appDb.getRandomEntry(app.displayRandomEntry);
      } else {
        alert("Nothing to say? Nothing to save.");
      }
    });

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
      $("#entry-date").text($.timeago(row.added_on));
      $("#randomEntry").text(row.entry);
      $("#label-past").text("Something you wrote");
    } else {
      console.log("No memories found"); //should never happen
    }
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
            // alert('message = '+e.message+' msgcnt = '+e.msgcnt);
            console.log("Received a message from mylife server" + e.message);
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
