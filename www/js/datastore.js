/* http://www.html5rocks.com/en/tutorials/webdatabase/todo/ - Apache 2.0 License */

var appDb = {
  db: null,
  open: function () {
    var dbSize = 5 * 1024 * 1024; // 5MB
    appDb.db = openDatabase("Entries", "1", "My Life Memories", dbSize);
  },
  onError: function (tx, e) {
    alert("There has been an error: " + e.message);
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
  // Adds a new entry and calls the function to switch to next page
  addEntry: function (entryText, switchEntryAddedPage) {
    appDb.db.transaction(function(tx){
      // The timeago jQuery plugin needs the data to be in ISO format.
      var addedOn = new Date().toISOString();
      var santizedEntry = appDb.sanitiseForSql(entryText);
      console.log("Adding santizedEntry: " + santizedEntry);
      
      tx.executeSql("INSERT INTO entries(entry, added_on) VALUES (?,?)",
          [santizedEntry, addedOn],
          function(tx, results){
            console.log("Inserted new entry with ID: " + results.insertId);
            if (switchEntryAddedPage !== undefined) {
              switchEntryAddedPage(results.insertId, entryText);
            }
          },
          appDb.onError);
     });

  },
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
        appDb.import();
      }, 15000);

      // 25 secs later, export the DB out again!
      setTimeout( function () {
        console.log("Final Export Test...");
        appDb.export();
      }, 25000);

      // 35 secs later, import the DB again!
      setTimeout( function () {
        console.log("Final Import Test...");
        appDb.import();
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

  },
  updateEntry: function (id, entry) {
    console.log("Updating ID: " + id);
    appDb.db.transaction(function(tx) {
      tx.executeSql("UPDATE entries SET entry = ? WHERE ID = ?",
        [entry, id],
        function (tx, rs) {
          console.log("FIXED ID:");
        },
        appDb.onError);
    });
  },
  deleteEntry: function (id) {
    console.log("DELETING ID: " + id);
    appDb.db.transaction(function(tx) {
      tx.executeSql("DELETE FROM entries WHERE ID = ?",
        [id],
        function (tx, rs) {
          console.log("Deleted!");
        },
        appDb.onError);
    });
  },
  deleteAllEntries: function(renderFunc) {
    appDb.db.transaction(function(tx) {
      tx.executeSql("DELETE FROM entries", [], renderFunc, appDb.onError);
    });
  },
  getAllEntries: function (renderFunc) {
    appDb.db.transaction(function(tx) {
      tx.executeSql("SELECT * FROM entries", [], renderFunc, appDb.onError);
    });
  },
  getRandomEntry: function (renderFunc) {
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
            renderFunc(row, len);
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
  import: function () {

    fileTransfer.download(app.userName + ".sql", appDb.decrypt);

  },
  export: function () {
    cordova.plugins.sqlitePorter.exportDbToSql(appDb.db, {
        successFn: function (sql, count) {
          console.log("Exported SQL: " + sql);
          console.log("Exported SQL contains: " + count + "statements");
          console.log("Creating file: " + app.userName + ".sql");
          window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
            // fileSystem.root points to file:///sdcard if SDCARD exists, else file:///data/data/$PACKAGE_NAME
            fileSystem.root.getFile(app.userName + ".sql", {create: true, exclusive: false}, function (fileEntry) {
              fileEntry.createWriter(function (writer) {
                try {
                  console.log("URL to file: " + fileEntry.toURL());
                  var cipherText = sjcl.encrypt(app.passphrase, sql);
                  writer.write(cipherText);
                  console.log("Backup file written!");

                  // Send the encrypted backup to the server
                  fileTransfer.upload(fileEntry);

                } catch (error) {
                  console.log("Error encrypting backup: " + error.message);
                }
              }, appDb.failFile);
            }, appDb.failFile);
          }, appDb.failFile);
        } // End successFn
    });
  },
  decrypt: function () {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
      // fileSystem.root points to file:///sdcard if SDCARD exists, else file:///data/data/$PACKAGE_NAME
      fileSystem.root.getFile(app.userName + ".sql", {create: false, exclusive: false}, function (fileEntry) {
        fileEntry.file(function (file) {
          var reader = new FileReader();
          reader.onloadend = function(evt) {
            console.log("Read as text");
            console.log(evt.target.result);
            var cipherText = evt.target.result;

            try {
              var sql = sjcl.decrypt(app.passphrase, cipherText);

              console.log("Backup file read: " + sql);
              cordova.plugins.sqlitePorter.importSqlToDb(appDb.db, sql, {
                successFn: function (count) {
                  console.log("Successfully imported " + count + " records");
                  console.log("Restored memories");
                },
                errorFn: function (error) {
                  console.log("Error importing database: " + error.message);
                },
                progressFn: function (current, total) {
                  console.log("Imported " + current + "/" + total + "statements");
                }
              });
            } catch (error) {
              console.log("Error decrypting backup: " + error.message);
              alert("Invalid passphrase. Please try again.");
            }
          };
          reader.readAsText(file);
        }, appDb.failFile);
      }, appDb.failFile);
    }, appDb.failFile);
  },
  failFile: function (event) {
    console.log("Error writing to backup file: " + event.target.error.code);
  },
  // Replace occurrences of 1 single quote with 2 single quotes to SQL-escape them.
  sanitiseForSql: function (value) {
    return (value+"").replace(/'([^']|$)/g,"''$1");
  },
  backupContent: function () {
    appDb.db.transaction(function(tx){
      tx.executeSql("SELECT * from entries", null, function(transaction, result) {
        if (result.rows.length > 0) {
          var memories = '{"entries":[';
          for (var i = 0; i < result.rows.length; ++i) {
            var row = result.rows.item(i);
            var entry = row.entry.replace(/(\r\n|\n|\r)/gm,"");
            console.log("Entry: " + entry + ", Length: " + entry.length);
            entry = entry.trim();
            memories = memories + '{"entry":"' + entry + '","added_on":"' + row.added_on + '"}';
            if (i + 1 < result.rows.length) {
              memories = memories + ',';
            }
          }

          memories = memories + ']}';
          console.log(memories);
          var memoriesObj = JSON.parse(memories);
          console.log(memoriesObj);
          console.log("count is: " + memoriesObj.entries.length);

          window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
            // fileSystem.root points to file:///sdcard if SDCARD exists, else file:///data/data/$PACKAGE_NAME
            fileSystem.root.getFile("mylife_backup.txt", {create: true, exclusive: false}, function (fileEntry) {
              fileEntry.createWriter(function (writer) {
                writer.write(memories);
                console.log("Backup file written!");
              }, appDb.failFile);
            }, appDb.failFile);
          }, appDb.failFile);
        } else {
          alert("No content to backup");
        }
      },
      appDb.onError);
    });
  }
};