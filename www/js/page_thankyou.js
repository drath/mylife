var page_thankyou = {

  last_inserted: null,

  //
  // FIXME: Make sure this function is called exactly 1nce!
  //

  init: function () {

    // Take a picture using camera, picture is stored in MyLife directory

    $('#cameraBtn').on('click', function(e){
      console.log("You clicked the camera button");
      e.preventDefault();
      page_thankyou.attachPicture(navigator.camera.PictureSourceType.CAMERA);
    });

    // Attach a picture from the gallery. Warning: The picture is not copied
    // to the MyLife directory, so if the picture is deleted from the gallery
    // the memory entry will be corrupted. Maybe we should make a copy? (TBD)

    $('#galleryBtn').on('click', function(e){
      console.log("You clicked the gallery button");
      e.preventDefault();
      page_thankyou.attachPicture(navigator.camera.PictureSourceType.SAVEDPHOTOALBUM);
    });

    // Attach an audio file

    $("#audioFileBtn").on("click", function (e) {
      fileChooser.open(function (uri) {
        page_thankyou.attachFile(uri, function (movedUri) {
          page_thankyou.showAttachment(movedUri);
        });
      }, function () {
        toastr.error("Error choosing file: " + error);
      });
    });

    // Edit current memory (the most recently added one)

    $("#editCurrentMemoryBtn").on("click", function (e){
      $("#entry-added-page .entryText").focus();
    });

    // When user focuses out of edit box, save the entry!

    $("#entry-added-page .entryText").on("focusout", function (e){
      var text = $("#entry-added-page .entryText").val();
      toastr.success("New text is: " + text);
      if (text.length > 0) {
        appDb.updateEntry(app.last_inserted, text, function () {
          toastr.success("Memory updated");
        });
      }
    });

    // Mark a memory as important

    $('#starBtn').on('click', function(e){

      if (this.className.indexOf("fa-star-o") > -1) {
        appDb.addMemorable(app.last_inserted);
      } else {
        appDb.removeMemorable(app.last_inserted);
      }
      $(this).toggleClass("fa-star-o");
    });

  },

  //
  // Display the memory text and the number of memories
  //

  display: function (last_inserted, entryText, addedOn, cbfn) {

    // Set the memory entry

    $(".entryText").val(entryText);

    // Clear out attachment, if any

    page_thankyou.clearAttachment();

    // Needed for later on, in case user adds an attachment

    page_thankyou.last_inserted = last_inserted;

    // Display the total number of entries

    appDb.getEntryCount(function (count) {
      console.log("There are now " + count + "memories");
      $("#totalEntriesThankyou").text(count + " memories");

      if (cbfn !== undefined) {
        cbfn(count);
      }
      
    });

    // Display the page

    $.mobile.changePage("#entry-added-page");

  },

  //
  // User wants to attach a picture to the memory
  //

  attachPicture: function (source, cbfn) {

    var photo_split = "";

    console.log("Inside FUNCTION attach picture: " + source);
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

        page_thankyou.attachFile(imageUri, function (movedUri) {
          page_thankyou.showAttachment(movedUri);

          if (cbfn !== undefined) {
            cbfn(movedUri);
          }
        });

      },
      function(message){
        console.log("cancelled: " + message);
        toastr.warning(message + " Please make sure that selected file is an image");
      },
      options);
  },

  //
  // Given a file uri, attach it to the database and send to server
  //

  attachFile: function (uri, cbfn) {

    // We must have a valid memory to attach to

    console.log("YYYYYYYYLast inserted ID is: " + page_thankyou.last_inserted);
    
    if (page_thankyou.last_inserted === undefined) {

      console.log("XXXXXXXXXLast inserted ID is: " + page_thankyou.last_inserted);
      toastr.warn("Internal error, the last entry ID was not found");
      return;
    }

    // To move the file, get a file entry object

    window.resolveLocalFileSystemURL(uri, function(origFileEntry) {

      console.log("origFileEntry:" + origFileEntry.name);

      // Create a new unique name

      var newName = app.userName + "-" + Date.now() + "-" + origFileEntry.name;

      console.log("New FILENAME is is is is is: " + newName);
      
      // Rename and move the file to the mylife dir

      appFile.moveFile2(origFileEntry, app.rootDir, newName, function (movedFileEntry) {
        
        // Update the attachments table 

        appDb.addAttachment(movedFileEntry.toURL(), page_thankyou.last_inserted);

        console.log("Reading attachment as base 64 encoding");

        // Now post this attachment to the web. FIXME: This posts as web

        movedFileEntry.file(function (readable) {
          console.log("Creating the reader object");
          var reader = new FileReader();
          reader.onloadend = function (evt) {

            // We have binary data now

            console.log("Inside onloadend");
            var dataURL = evt.target.result;
            console.log("Binary image data is: " + dataURL);

            // Attach and send!

            var memoryObj = {};
            memoryObj["img"] = dataURL;
            memoryObj["remoteId"] = page_thankyou.last_inserted;
            ajax.sendToWeb(memoryObj);

          };

          // Read the file as binary 

          reader.readAsDataURL(readable);
        }, app.fsFail);

        // Let the caller know of the new location

        if (cbfn !== undefined) {
          cbfn(movedFileEntry.toURL());
        }

      });
    },
    null);
  },

  //
  // Based on Uri, show the correct type of attachment
  //

  showAttachment: function (uri) {

    page_thankyou.clearAttachment();

    // Is this an audio attachment?

    if (uri.indexOf("aac") !== -1) {

      // Yes, show audio

      $(".entryAudio").attr("src", uri);
      $(".entryAudio").show();

    } else {

      // No, this is a image

      $(".entryImage").attr("src", uri);
      $(".entryImage").show();

    }
  },

  //
  // Resets all the entry HTML elements - text, image and audio
  //

  clearAttachment: function () {

    $(".entryAudio").attr("src", "");
    $(".entryAudio").hide();

    $(".entryImage").attr("src", "");
    $(".entryImage").hide();

  }

};