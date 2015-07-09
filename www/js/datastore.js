/* http://www.html5rocks.com/en/tutorials/webdatabase/todo/ - Apache 2.0 License */

var appDb = {
  db: null,
  backupCount: null,
  open: function () {
    var dbSize = 5 * 1024 * 1024; // 5MB
    appDb.db = openDatabase("Entries", "1", "My Life Memories", dbSize);
  },
  onError: function (tx, e) {
    toastr.error("Database error: " + e.message);
  },
  onSuccess: function () {
  },
  createTable: function () {
    appDb.db.transaction(function(tx) {
      tx.executeSql("CREATE TABLE IF NOT EXISTS " +
                    "entries(ID INTEGER PRIMARY KEY ASC, entry TEXT, added_on DATETIME)", []);
      tx.executeSql("CREATE TABLE IF NOT EXISTS " +
                    "attachments(ID INTEGER PRIMARY KEY ASC, entryId INTEGER, path TEXT, added_on DATETIME)", []);
    });
  },
  // Adds a new entry, making sure to santize the entry for SQL inserting to db
  addEntry: function (entryText, cbfn) {
    appDb.db.transaction(function(tx){
      // The timeago jQuery plugin needs the data to be in ISO format.
      var addedOn = new Date().toISOString();
      var santizedEntry = appDb.sanitiseForSql(entryText);
      tx.executeSql("INSERT INTO entries(entry, added_on) VALUES (?,?)",
          [santizedEntry, addedOn],
          function(tx, results){
            console.log("Inserted new entry with ID: " + results.insertId);
            if (cbfn !== undefined) {
              cbfn(results.insertId, entryText);
            }
          },
          appDb.onError);
     });

  },
  updateEntry: function (id, entry) {
    console.log("Updating ID: " + id);
    appDb.db.transaction(function(tx) {
      tx.executeSql("UPDATE entries SET entry = ? WHERE ID = ?",
        [entry, id],
        appDb.onSuccess,
        appDb.onError);
    });
  },
  deleteEntry: function (id) {
    console.log("Deleting ID: " + id);
    appDb.db.transaction(function(tx) {
      tx.executeSql("DELETE FROM entries WHERE ID = ?",
        [id],
        appDb.onSuccess,
        appDb.onError);
    });
  },
  deleteAllEntries: function(cbfn) {
    appDb.db.transaction(function(tx) {
      tx.executeSql("DELETE FROM entries", [], cbfn, appDb.onError);
    });
  },
  getAllEntries: function (cbfn) {
    appDb.db.transaction(function(tx) {
      tx.executeSql("SELECT COUNT(*) AS count FROM entries", [], function (tx, rs) {
        var count = rs.rows.item(0).count;
        if (cbfn !== undefined) {
          cbfn(count);
        }
      }, appDb.onError);
    });
  },
  getRandomEntry: function (cbfn) {
    appDb.db.transaction(function(tx) {
      tx.executeSql("SELECT * FROM entries ORDER BY ID",
        [],
        function (tx, rs) {
          var len = rs.rows.length;

          if (len > 0) {
            //generate random number
            var i = Math.floor(Math.random() * len);

            //get row
            var row = rs.rows.item(i);
            cbfn(row, len);
          }
        },
        appDb.onError);
    });
  },
  addAttachment: function (path, entryId) {
    console.log("adding attachment: " + path);
    appDb.db.transaction(function(tx){
      var addedOn = new Date().toISOString();
      tx.executeSql("INSERT OR REPLACE INTO attachments(entryId, path, added_on) VALUES (?,?,?)",
          [entryId, path, addedOn],
          appDb.onSuccess,
          appDb.onError);
    });
  },
  getAttachmentsByEntryId: function (renderFunc, entryId) {
    // FIXME: Currently returning all attachments!
    console.log("inside getAttachmentsByEntryId for ID: " + entryId);
    appDb.db.transaction(function(tx) {
      tx.executeSql("SELECT * FROM attachments WHERE entryId=?",
        [entryId],
        function (tx, rs) {
          renderFunc(rs.rows);
        },
        appDb.onError);
    });
  },
  // Export the database, encrypt the contents and upload to server
  export: function () {
    // The backup filename contains the userName, so we need userName.
    if ( (app.userName === undefined) || (app.userName.length === 0) ) {
      toastr.error("Unable to determine username. Please restart app and try again.");
      return;
    }
    cordova.plugins.sqlitePorter.exportDbToSql(appDb.db, {
        successFn: function (sql, count) {
          window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
            // fileSystem.root points to file:///sdcard if SDCARD exists, else file:///data/data/$PACKAGE_NAME
            fileSystem.root.getFile(app.userName + ".sql", {create: true, exclusive: false}, function (fileEntry) {
              fileEntry.createWriter(function (writer) {
                try {
                  var cipherText = sjcl.encrypt(app.passphrase, sql);
                  writer.write(cipherText);

                  // Send the encrypted backup to the server
                  fileTransfer.upload(fileEntry);

                } catch (error) {
                  console.log("Error encrypting backup: " + error.message);
                  toastr.error("Error encrypting backup, backup failed: " + error.message);
                }
              }, appDb.failFile);
            }, appDb.failFile);
          }, appDb.failFile);
        } // End successFn
    });
  },
  // Will import an encrypted db. Db needs to exist on sdcard, at root location
  // Will backup to json before modifying the DB as a precautionary measure
  import: function (onImportSuccess) {

    //
    // This is data-destructive operation. Let's backup the db to 
    // json, before we make changes to the db.
    //

    cordova.plugins.sqlitePorter.exportDbToJson(appDb.db, {
        successFn: function (json, statementCount) {
          window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
            // fileSystem.root points to file:///sdcard if SDCARD exists, else file:///data/data/$PACKAGE_NAME
            fileSystem.root.getFile(app.userName + ".txt", {create: true, exclusive: false}, function (fileEntry) {
              fileEntry.createWriter(function (writer) {
                try {

                  writer.write(json);

                  // Now import without fear
                  window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
                    // fileSystem.root points to file:///sdcard if SDCARD exists, else file:///data/data/$PACKAGE_NAME
                    fileSystem.root.getFile(app.userName + ".sql", {create: false, exclusive: false}, function (fileEntry) {
                      fileEntry.file(function (file) {
                        var reader = new FileReader();
                        reader.onloadend = function(evt) {
                          console.log(evt.target.result);
                          var cipherText = evt.target.result;

                          try {
                            var sql = sjcl.decrypt(app.passphrase, cipherText);
                            cordova.plugins.sqlitePorter.importSqlToDb(appDb.db, sql, {
                              successFn: function (count) {
                                console.log("Successfully imported " + count + " records");
                                if (onImportSuccess !== undefined) {
                                  onImportSuccess(count);
                                }
                              },
                              errorFn: function (error) {
                                console.log("Error importing database: " + error.message);
                                toastr.error("Error importing database: " + error.message);

                                //
                                // Bummer, importing the remote backup failed. Let's impot
                                // the local json backup we created just before we started the 
                                // remote operation
                                //

                                cordova.plugins.sqlitePorter.importJsonToDb(appDb.db, json, {
                                  successFn: function (count) {
                                    console.log("Successfully json-imported " + count + " records");
                                  },
                                  errorFn: function (error) {
                                    console.log("Error importing database: " + error.message);
                                    toastr.error("Error importing local backup database: " + error.message);
                                    // Now we're really screwed. Ask user to email himself the .txt json 
                                    // file from the root location.
                                    return true;
                                  },
                                  progressFn: function (current, total) {
                                    console.log("Imported json " + current + "/" + total + "statements");
                                  }
                                });

                                // This should trigger a rollback?
                                return true;
                              },
                              progressFn: function (current, total) {
                                console.log("Imported " + current + "/" + total + "statements");
                              }
                            });
                          } catch (error) {
                            console.log("Error decrypting backup: " + error.message);
                            toastr.warning("Invalid passphrase. Please try again.");
                          }
                        };
                        reader.readAsText(file);
                      }, appDb.failFile);
                    }, appDb.failFile);
                  }, appDb.failFile);
                } catch (error) {
                  console.log("Error encrypting backup: " + error.message);
                  toastr.error("Error encrypting backup, backup failed: " + error.message);
                }
              }, appDb.failFile);
            }, appDb.failFile);
          }, appDb.failFile);
        } // End successFn
    });
  },
  failFile: function (event) {
    console.log("Backup failed. " + event.target.error.code);
    toast.error("Backup failed. " + event.target.error.code);
  },
  // Replace occurrences of 1 single quote with 2 single quotes to SQL-escape them.
  sanitiseForSql: function (value) {
    return (value+"").replace(/'([^']|$)/g,"''$1");
  },
  //TBD: Remove
  testExportImport: function () {
    var testEntries = ["I won't do it",
      "I should'nt do it",
      "That's the strategy",
      "Won't should'nt",
      "It's my life",
      "Doesn't matter to me",
      "Hokiee'd",
      "Rs. 100 and 500$'s",
      "!@#$%^&*()::;',.<>?"];

    // Failures: "This'''is nuts"

    // Delete all entries before starting the test
    appDb.deleteAllEntries(function (){

      //
      // Start the test
      //

      // Add the test entries
      for (var i = 0; i < testEntries.length; ++i) {
        var entry = testEntries[i];
        appDb.addEntry(entry);
      }

      // 5 secs wait, then export them to remote server
      setTimeout( function () {
        console.log("Starting Export Test...");
        appDb.export();
      }, 5000);
    
      // 15 secs wait, then import them from remote server
      setTimeout( function () {
        console.log("Starting Import Test...");
        fileTransfer.download(app.userName + ".sql", function () {
          appDb.import(app.onImportSuccess);
        });
      }, 15000);

      // 25 secs later, export the DB out again!
      setTimeout( function () {
        console.log("Final Export Test...");
        appDb.export();
      }, 25000);

      // 35 secs later, import the DB again!
      setTimeout( function () {
        console.log("Final Import Test...");

        fileTransfer.download(app.userName + ".sql", function () {
          appDb.import(app.onImportSuccess);
        });

      }, 35000);

      // 45 secs wait, then dump the DB contents and check
      setTimeout(function () {
        console.log("Dumping database");
        appDb.getAllEntries(function (tx, rs) {
          var len = rs.rows.length;
          for (var i = 0; i < len; ++i) {
            var row = rs.rows.item(i);
            console.log("Entry: " + row.entry);
            if (row.entry !== testEntries[i]) {
              console.log("TEST FAILED!");
              return;
            }
          }
          console.log("TEST PASSED!!!!");
          return;
        },
        appDb.onError);
      }, 45000);

    },
    appDb.onError);

  },
  // TBD: Remove
  oneTimeFix: function () {
    // won't, that's, i'd, 
    var badRows = [];
    appDb.db.transaction(function(tx) {
      tx.executeSql("SELECT * FROM entries ORDER BY ID",
        [],
        function (tx, rs) {
          var len = rs.rows.length;
          // Find the bad rows...
          for (var i = 0; i < len; ++i) {
            var row = rs.rows.item(i);
            var entry = row.entry;
            console.log("Entry: " + entry);

            // http://stackoverflow.com/questions/21446925/regex-to-detect-an-odd-number-of-consecutive-quotes
            var santizedEntry = entry.replace(/\'\'?/g, "''");
            if (santizedEntry !== entry) {
              var badRow = {};
              badRow.ID = row.ID;
              badRow.entry = santizedEntry;
              badRows.push(badRow);
              console.log("Number of bad rows is now: " + badRows.length);
            }
          }

          // ...and fix them
          console.log("AAAAAAAAAAAAAAAAAAXXXXXXXXX entries...number of bad entries is: " + badRows.length);
          for (var j = 0; j < badRows.length; ++j) {
            appDb.updateEntry(badRows[j].ID, badRows[j].entry);
          }
        },
        appDb.onError);
    });
  }
};