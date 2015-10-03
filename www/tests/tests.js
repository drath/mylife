// QUnit.test("Datastore.js tests", function (assert) {
//   assert.expect(9);

//   // Expect to be logged in!
//   var uid = window.localStorage.getItem("uid");

//   appDb.open();
//   appDb.createTable();

//   var getAllEntriesDone = assert.async();
//   var addEntryDone = assert.async();
//   var updateEntryDone = assert.async();
//   var randomEntryDone = assert.async();
//   var exportEntriesDone = assert.async();
//   var downloadEntriesDone = assert.async();
//   var importEntriesDone = assert.async();
//   var deleteEntryDone = assert.async();
//   var deleteAllEntriesDone = assert.async();

//   appDb.getAllEntries(function () {
//     assert.ok(true, "All entries retrieved");
//     getAllEntriesDone();

//     appDb.addEntry("This is a test entry", function(id, entryText) {
//       assert.ok(true, "Entry added, ID: " + id + " Text: " + entryText);
//       addEntryDone();

//       appDb.updateEntry(id, "This entry was updated", function () {
//         assert.ok(true, "Entry updated");
//         updateEntryDone();

//         appDb.getRandomEntry(function () {
//           assert.ok(true, "Random entry retrieved");
//           randomEntryDone();

//           appDb.export("secret", uid, function () {
//             assert.ok(true, "All entries exported");
//             exportEntriesDone();

//             fileTransfer.download(uid + ".sql", function () {
//               assert.ok(true, "Entries downloaded");
//               downloadEntriesDone();

//               appDb.import("secret", uid, function (){
//                 assert.ok(true, "Entries imported");
//                 importEntriesDone();

//                 appDb.deleteEntry(id, function () {
//                   assert.ok(true, "Entry deleted");
//                   deleteEntryDone();

//                   appDb.deleteAllEntries(function () {
//                     assert.ok(true, "All entries deleted");
//                     deleteAllEntriesDone();
//                   });
//                 });
//               });
//             });
//           });
//         });
//       });
//     });
//   });
// });

QUnit.test( "Add a new memory", function(assert) {

  assert.expect(2);

  var addEntryDone = assert.async();

  appDb.open();
  appDb.createTable();

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

//
// Test: Attach a picture (from camera) to the preceding memory
//

QUnit.test( "Attach from camera", function(assert) {

  assert.expect(1);

  var attachPictureDone = assert.async();

  var uid = window.localStorage.getItem("uid");
  if (uid !== null && uid.length > 0) {
    console.log("Found UID is: " + uid);
    app.userName = uid;
  } else {
    assert.ok(false, "No uid found, tests will halt now!");
  }


  auth.init();
  appFile.init();

  page_thankyou.init();

  page_thankyou.attachPicture(navigator.camera.PictureSourceType.CAMERA, function (uri) {

    console.log("Uri is: " + uri);
    assert.ok(true, "Picture attached");
    attachPictureDone();

  });

});

// QUnit.test("Page tests", function (assert) {

//   assert.expect(2);

//   appDb.open();
//   appDb.createTable();

//   var addEntryFromPageHomeDone = assert.async();
//   var clearAttachmentFromPageThankyouDone = assert.async();

//   page_home.addEntry("Added from qunit", function() {
//     assert.ok(true, "Entry added via page_home");
//     addEntryFromPageHomeDone();
//   });

//   page_thankyou.clearAttachment(function() {
//     assert.ok(true, "Cleared all attachments");
//     clearAttachmentFromPageThankyouDone();
//   });

// });