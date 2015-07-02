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
      tx.executeSql("INSERT INTO entries(entry, added_on) VALUES (?,?)",
          [entryText, addedOn],
          function(tx, results){
            console.log("Inserted new entry with ID: " + results.insertId);
            switchEntryAddedPage(results.insertId, entryText);
          },
          appDb.onError);
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
          window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
            // fileSystem.root points to file:///sdcard if SDCARD exists, else file:///data/data/$PACKAGE_NAME
            fileSystem.root.getFile(app.userName + ".sql", {create: true, exclusive: false}, function (fileEntry) {
              fileEntry.createWriter(function (writer) {
                try {
                  console.log("URL to file: " + fileEntry.toURL());
                  var cipherText = sjcl.encrypt("password", sql);
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
              var sql = sjcl.decrypt("password", cipherText);
              console.log("Backup file read: " + sql);
              cordova.plugins.sqlitePorter.importSqlToDb(appDb.db, sql, {
                successFn: function (count) {
                  console.log("Successfully imported " + count + " records");
                  alert("Restored memories");
                },
                errorFn: function (error) {
                  console.log("Error importing database: " + error);
                },
                progressFn: function (current, total) {
                  console.log("Imported " + current + "/" + total + "statements");
                }
              });
            } catch (error) {
              console.log("Error decrypting backup: " + error.message);
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