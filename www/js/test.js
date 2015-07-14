var testRunner = {
  run: function () {
    console.log("*** Starting backup test...");

    var testEntries = ["I won't do it",
      "I should'nt do it",
      "That's the strategy",
      "Won't should'nt",
      "It's my life",
      "Doesn't matter to me",
      "Hokiee'd",
      "Rs. 100 and 500$'s",
      "!@#$%^&*()::;',.<>?"];

    // Test: Add some entries
    for (var i = 0; i < testEntries.length; ++i) {
      var entry = testEntries[i];
      app.addEntry(entry);
    }

    // Test: Backup entries to the cloud
    app.backup("secret");

    // Test: 5 secs later, restore them from the cloud
    setTimeout( function () {
      console.log("*** Starting restore test...");
      app.restore("secret");
    }, 30000);
  }
};