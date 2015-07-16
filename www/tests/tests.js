QUnit.test("Datastore.js tests", function (assert) {
  assert.expect(9);

  // Expect to be logged in!
  var uid = window.localStorage.getItem("uid");

  appDb.open();
  appDb.createTable();

  var getAllEntriesDone = assert.async();
  var addEntryDone = assert.async();
  var updateEntryDone = assert.async();
  var randomEntryDone = assert.async();
  var exportEntriesDone = assert.async();
  var downloadEntriesDone = assert.async();
  var importEntriesDone = assert.async();
  var deleteEntryDone = assert.async();
  var deleteAllEntriesDone = assert.async();

  appDb.getAllEntries(function () {
    assert.ok(true, "All entries retrieved");
    getAllEntriesDone();

    appDb.addEntry("This is a test entry", function(id, entryText) {
      assert.ok(true, "Entry added, ID: " + id + " Text: " + entryText);
      addEntryDone();

      appDb.updateEntry(id, "This entry was updated", function () {
        assert.ok(true, "Entry updated");
        updateEntryDone();

        appDb.getRandomEntry(function () {
          assert.ok(true, "Random entry retrieved");
          randomEntryDone();

          appDb.export("secret", uid, function () {
            assert.ok(true, "All entries exported");
            exportEntriesDone();

            fileTransfer.download(uid + ".sql", function () {
              assert.ok(true, "Entries downloaded");
              downloadEntriesDone();

              appDb.import("secret", uid, function (){
                assert.ok(true, "Entries imported");
                importEntriesDone();

                appDb.deleteEntry(id, function () {
                  assert.ok(true, "Entry deleted");
                  deleteEntryDone();

                  appDb.deleteAllEntries(function () {
                    assert.ok(true, "All entries deleted");
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

  
  
});