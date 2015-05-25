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
            renderFunc(row);
          }
        }, 
        appDb.onError);
    });
  },
  addAttachment: function (path, entryId) {
    console.log("adding attachment: " + path);
    appDb.db.transaction(function(tx){
      var addedOn = new Date().toISOString();
      tx.executeSql("INSERT INTO attachments(entryId, path, added_on) VALUES (?,?,?)",
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
  }
}