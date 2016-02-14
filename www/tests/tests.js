/////////////////////////////////////////////////////////////////////////////////

//
//  mylife unit tests
//

/////////////////////////////////////////////////////////////////////////////////


QUnit.module('Datastore API', {
  setup: function () {

    // Expect to be logged in!
    var uid = window.localStorage.getItem("uid");

    appDb.open();
    appDb.createTable();

    auth.init();
    appFile.init();

  },
  teardown: function () {

  }
});

/////////////////////////////////////////////////////////////////////////////////

//
// filetransfer.js unit tests
// (Note: This test must run first, since it downloads a file for audio test later on) 
//

/////////////////////////////////////////////////////////////////////////////////

QUnit.test("Filetransfer tests", function (assert) {

  assert.expect(1);

  var fileTransferDone = assert.async();

  var audioTestFile = "test_audio.aac";

  fileTransfer.download(audioTestFile, function () {

    console.log("File downloaded!!!");
    assert.ok("fileTransfer OK");
    fileTransferDone();

  });

  var imageTestFile = "test_image.jpg";

  fileTransfer.download(imageTestFile, function () {
    console.log("File downloaded!!!");
  });



});



/////////////////////////////////////////////////////////////////////////////////

//
//  datastore.js unit tests
//

/////////////////////////////////////////////////////////////////////////////////

QUnit.test("Datastore.js API tests", function (assert) {
  assert.expect(8);

  var getAllEntriesDone = assert.async();
  var addEntryDone = assert.async();
  var updateEntryDone = assert.async();
  var randomEntryDone = assert.async();
  var deleteEntryDone = assert.async();
  var deleteAllEntriesDone = assert.async();
  var getLastAttachmentByEntryIdDone = assert.async();
  var getEntryCountDone = assert.async();

  appDb.getAllEntries(function () {
    assert.ok(true, "getAllEntries OK");
    getAllEntriesDone();

    appDb.addEntry("This is a test entry", function(id, entryText) {
      assert.ok(true, "addEntry OK. Entry added, ID: " + id + " Text: " + entryText);
      addEntryDone();

      appDb.updateEntry(id, "This entry was updated", function () {
        assert.ok(true, "updateEntry OK");
        updateEntryDone();

        appDb.getRandomEntry(function () {
          assert.ok(true, "Random entry retrieved");
          randomEntryDone();

          appDb.getLastAttachmentByEntryId(id, function () {
            assert.ok(true, "getLastAttachmentByEntryId");
            getLastAttachmentByEntryIdDone();

            appDb.getEntryCount(function () {
              assert.ok(true, "getEntryCountDone");
              getEntryCountDone();

              appDb.deleteEntry(id, function () {
                assert.ok(true, "deleteEntry OK");
                deleteEntryDone();

                appDb.deleteAllEntries(function () {
                  assert.ok(true, "deleteAllEntries OK");
                  deleteAllEntriesDone();
                });
              });
            });
          });
        });
      });
    });
  });
});


QUnit.test("Next, Previous", function (assert) {
  assert.expect(2);

  var getNextDone = assert.async();
  var getPrevDone = assert.async();

  appDb.addEntry("Entry-1", function(id1, entryText) {
    appDb.addEntry("Entry-2", function(id2, entryText) {
      appDb.addEntry("Entry-3", function(id3, entryText) {
        appDb.getNext(id2, function () {
          assert.ok(true, "getNext OK");
          getNextDone();
          appDb.getPrev(id2, function () {
            assert.ok(true, "getPrev OK");
            getPrevDone();
          });
        });

      });
    });
  });
});

QUnit.test("Memorable", function (assert) {
  assert.expect(3);

  var isEntryMemorableDone = assert.async();

  appDb.addEntry("Entry-1", function(id, entryText) {

    appDb.addMemorable(id);
    assert.ok(true, "addMemorable OK");

    appDb.removeMemorable(id);
    assert.ok(true, "removeMemorableDone OK");

    appDb.isEntryMemorable(function (isEntryMemorable) {
      assert.ok(true, "isEntryMemorable OK");
      isEntryMemorableDone();
    }, id);
  });
});

QUnit.test("getAllAttachments", function (assert) {
  assert.expect(1);

  var getAllAttachmentsDone = assert.async();
  appDb.getAllAttachments(function () {
    assert.ok(true, "getAllAttachments OK");
    getAllAttachmentsDone();
  });
});

QUnit.test( "Add a new memory", function(assert) {

  assert.expect(2);
  var addEntryDone = assert.async();

  var last_inserted;

  // Do not allow user to submit a memory with no text

  last_inserted = page_home.addEntry("");
  assert.equal(last_inserted, null, "Zero length memory text");

  // Find how many memories we have right now...

  appDb.getEntryCount(function (oldMemoryCount) {

    console.log("oldMemoryCount is: " + oldMemoryCount);
    
    // Now, submit a new entry 

    page_home.addEntry("Added by unit testing", function (last_inserted, entryText, addedOn) {

      // Display the new memory

      page_thankyou.display(last_inserted, entryText, addedOn, function (newMemoryCount) {

        // Assert that the number of memories has increased by 1

        assert.ok(newMemoryCount === oldMemoryCount + 1, "Added new memory entry");

        addEntryDone();

      });

    });
    
  });

});


/////////////////////////////////////////////////////////////////////////////////

//
//  entry_card.js unit tests
//

/////////////////////////////////////////////////////////////////////////////////


// QUnit.module("entry_card.js");

QUnit.test('Entry Card', function(assert) {

  assert.expect(1);
  var displayEntryDone = assert.async();

  appDb.getRandomEntry(entryCard.displayEntry);
  assert.ok("displayEntry OK");
  displayEntryDone();

  entryCard.clearCard();

});

/////////////////////////////////////////////////////////////////////////////////

//
//  page_thankyou.js unit tests
//

/////////////////////////////////////////////////////////////////////////////////

QUnit.test( "Attach pic", function(assert) {

  assert.expect(1);

  var attachFileDone = assert.async();

  page_thankyou.init();

  // This file was downloaded to the root folder during fileTransfer tests

  var imageUri = "file:///storage/emulated/0/test_image.jpg";

  page_thankyou.attachFile(imageUri, function (movedUri) {

    assert.ok("attachFile OK");
    attachFileDone();

    page_thankyou.showAttachment(movedUri);

  });

});

// QUnit.test( "Attach from camera", function(assert) {

//   assert.expect(2);

//   var attachPictureDone = assert.async();
//   var moveFile2Done = assert.async();

//   page_thankyou.init();

//   page_thankyou.attachPicture(navigator.camera.PictureSourceType.CAMERA, function (uri) {

//     console.log("Uri is: " + uri);
//     assert.ok(true, "Picture attached");
//     attachPictureDone();

//     window.resolveLocalFileSystemURL(uri, function(fileEntry) {

//       appFile.moveFile2(fileEntry, app.rootDir, "newName", function (movedFileEntry) {
//         assert.ok("moveFile2 OK");
//         moveFile2Done();
//       });
//     });

//   });
// });

QUnit.test( "Attach audio", function(assert) {

  assert.expect(1);

  // This file was downloaded to the root folder during fileTransfer tests

  var audioUri = "file:///storage/emulated/0/test_audio.aac";
  page_thankyou.attachAudio(audioUri);
  assert.ok("attachAudio OK");

});

/////////////////////////////////////////////////////////////////////////////////

//
//  util.js unit tests
//

/////////////////////////////////////////////////////////////////////////////////

QUnit.test( "Util tests", function(assert) {

  assert.expect(3);

  util.objDump(navigator);
  assert.ok("objDump OK");

  var audioUri = "content://com.android.externalstorage.documents/document/primary%3ADownload%2FPTT-20150924-WA0000.aac";
  util.isAudioFile(audioUri);
  assert.ok("isAudioFile OK");

  util.getNameFromPath(audioUri);
  assert.ok("getNameFromPath OK");

});

/////////////////////////////////////////////////////////////////////////////////

//
//  index.js unit tests
//

/////////////////////////////////////////////////////////////////////////////////

QUnit.test( "index.js tests", function(assert) {

  assert.expect(2);

  app.receivedEvent('deviceready');
  assert.ok("receivedEvent OK");

  app.backup();
  assert.ok("backup OK");

});


