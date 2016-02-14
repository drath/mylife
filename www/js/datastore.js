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
      tx.executeSql("CREATE TABLE IF NOT EXISTS " +
                    "memorables(ID INTEGER PRIMARY KEY ASC, entryId INTEGER)", []);
    });
  },

  //
  // Adds a new entry, making sure to santize the entry for SQL inserting to db
  // @unit_tested
  //

  addEntry: function (entryText, cbfn) {
    appDb.db.transaction(function(tx){

      // The timeago jQuery plugin needs the data to be in ISO format.

      var addedOn = new Date().toISOString();

      // Invalid chars can cause SQL to fail, remove them

      var santizedEntry = appDb.sanitiseForSql(entryText);

      // Insert the sanitized text into the database

      tx.executeSql("INSERT INTO entries(entry, added_on) VALUES (?,?)",
          [santizedEntry, addedOn],
          function (tx, results){

            // Also, post this memory to web
            var memoryObj = {};

            // The server inserts, or updates, based on remoteId
            memoryObj["remoteId"] = results.insertId;

            // Clear out old entries
            memoryObj["attachmentName"] = "";
            memoryObj["img"] = "";

            // Encrypt and set the text
            memoryObj["entry"] = sjcl.encrypt("passphrase", entryText);
            memoryObj["addedOn"] = addedOn;
            ajax.sendToWeb(memoryObj);

            // Done, callback

            if (cbfn !== undefined) {
              cbfn(results.insertId, entryText, addedOn);
            }
          },
          appDb.onError);
     });

  },

  //
  // Update the entry
  // @unit_tested
  //

  updateEntry: function (id, entry, cbfn) {
    appDb.db.transaction(function(tx) {
      tx.executeSql("UPDATE entries SET entry = ? WHERE ID = ?",
        [entry, id],
        function (tx, results) {

          // Post to web
          var memoryObj = {};
          memoryObj["remoteId"] = id;
          memoryObj["entry"] = sjcl.encrypt("passphrase", entry);
          ajax.sendToWeb(memoryObj);

          // Done, callback

          if (cbfn !== undefined) {
            cbfn();
          }
        },
        appDb.onError);
    });
  },

  //
  // Delete an entry
  // @unit_tested
  //

  deleteEntry: function (id, cbfn) {
    console.log("Deleting ID: " + id);
    appDb.db.transaction(function(tx) {
      tx.executeSql("DELETE FROM entries WHERE ID = ?",
        [id],
        function (tx, results) {
          if (cbfn !== undefined) {
            cbfn();
          }
        },
        appDb.onError);
    });
  },

  //
  // Deletes all entries
  // @unit_tested
  //

  deleteAllEntries: function(cbfn) {
    appDb.db.transaction(function(tx) {
      tx.executeSql("DELETE FROM entries",
      [],
      function (tx, results) {
        if (cbfn !== undefined) {
          cbfn();
        }
      },
      appDb.onError);
    });
  },

  //
  // Get next (memory)
  // @unit_tested
  //

  getNext: function (id, cbfn) {
    appDb.db.transaction(function(tx) {
      tx.executeSql("SELECT * FROM entries WHERE ID > ? ORDER BY ID",
        [id],
        function (tx, rs) {
          console.log("Number of rows returned: " + rs.rows.length);
          if (rs.rows.length > 0) {
            var row = rs.rows.item(0);
            if (cbfn !== undefined) {
              cbfn(row);
            }
          } else {
            console.log("No more memories!");
            toastr.warning("No more memories");
            return;
          }
        },
        appDb.onError);
    });
  },

  //
  // Get previous (memory)
  // @unit_tested
  //

  getPrev: function (id, cbfn) {
    appDb.db.transaction(function(tx) {
      tx.executeSql("SELECT * FROM entries WHERE ID < ? ORDER BY ID",
        [id],
        function (tx, rs) {
          console.log("Number of rows returned: " + rs.rows.length);
          if (rs.rows.length > 0) {
            var row = rs.rows.item(rs.rows.length - 1);
            if (cbfn !== undefined) {
              cbfn(row);
            }
          } else {
            toastr.warning("No more memories");
          }
        },
        appDb.onError);
    });
  },

  //
  // Get number of memories
  // @unit_tested
  //

  getEntryCount: function (cbfn) {
    appDb.db.transaction(function(tx) {
      tx.executeSql("SELECT COUNT(*) AS count FROM entries", [], function (tx, rs) {
        var count = rs.rows.item(0).count;
        if (cbfn !== undefined) {
          cbfn(count);
        }
      }, appDb.onError);
    });
  },

  //
  // Get all memories in the database
  // @unit_tested
  //

  getAllEntries: function (cbfn) {
    appDb.db.transaction(function(tx) {
      tx.executeSql("SELECT * FROM entries", [], function (tx, rs) {
        if (cbfn !== undefined) {
          cbfn(rs.rows);
        }
      }, appDb.onError);
    });
  },

  //
  // Get all attachments
  // @unit_tested
  //

  getAllAttachments: function (cbfn) {
    appDb.db.transaction(function(tx) {
      tx.executeSql("SELECT * FROM attachments",
        [],
        function (tx, rs) {
          cbfn(rs.rows);
        },
        appDb.onError);
    });
  },

  //
  // Get one random memory
  // @unit_tested
  //

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

            if (cbfn !== undefined) {
              cbfn(row);
            }
          }
        },
        appDb.onError);
    });
  },

  //
  // Mark this memory as memorable
  // @unit_tested
  //

  addMemorable: function (entryId) {
    console.log("Adding entry id: " + entryId + " as memorable...");
    appDb.db.transaction(function(tx){
      tx.executeSql("INSERT OR REPLACE INTO memorables(entryId) VALUES (?)",
          [entryId],
          function () {
            toastr.success("Flagged as memorable!");
          },
          appDb.onError);
    });
  },

  //
  // Mark this memory as un-memorable
  // @unit_tested
  //

  removeMemorable: function (entryId) {
    console.log("Removing entry id: " + entryId + " as memorable...");
    appDb.db.transaction(function(tx){
      tx.executeSql("DELETE FROM memorables WHERE entryId = ?",
          [entryId],
          appDb.onSuccess,
          appDb.onError);
    });
  },

  //
  // Check is memory is memorable
  // @unit_tested
  //

  isEntryMemorable: function (cbfn, entryId) {
    appDb.db.transaction(function(tx) {
      tx.executeSql("SELECT * FROM memorables WHERE entryId=?",
        [entryId],
        function (tx, rs) {
          var isMemorable = rs.rows.length > 0 ? true : false;
          cbfn(isMemorable);
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
  getAttachmentsByEntryId: function (cbfn, entryId) {
    // FIXME: Currently returning all attachments!
    console.log("inside getAttachmentsByEntryId for ID: " + entryId);
    appDb.db.transaction(function(tx) {
      tx.executeSql("SELECT * FROM attachments WHERE entryId=?",
        [entryId],
        function (tx, rs) {
          cbfn(rs.rows);
        },
        appDb.onError);
    });
  },
  getLastAttachmentByEntryId: function (entryId, cbfn) {
    appDb.db.transaction(function(tx) {
      tx.executeSql("SELECT * FROM attachments WHERE entryId=? ORDER BY ID DESC LIMIT 1",
        [entryId],
        function (tx, rs) {
          cbfn(rs.rows);
        },
        appDb.onError);
    });
  },

  failFile: function (error) {
    util.printError(error);
    toastr.error("Backup failed. " + error.code);
  },
  // Replace occurrences of 1 single quote with 2 single quotes to SQL-escape them.
  sanitiseForSql: function (value) {
    return (value+"").replace(/'([^']|$)/g,"''$1");
  },
  
};