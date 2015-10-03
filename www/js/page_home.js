var page_home = {

  init: function () {

    // Add note button: Save the entry to the entries table (in websql)

    $('#btnAddNote').on("click", function(e){
      console.log("You clicked on btnAddNote");
      var entryText = $("#note").val();
      page_home.addEntry(entryText, function (last_inserted, entryText, addedOn) {
        page_thankyou.display(last_inserted, entryText, addedOn);
      });
    });

    $(document).on('pageshow', '#main-page', function(){
      page_home.display();
    });

  },

  display: function () {

    // Set the initial state of the html elements

    $("#note").val("");
    $("#starBtn").removeClass("fa-star").addClass("fa-star-o fa-star");

    // Finally, Read a random entry back from the entries table

    console.log("Getting random entry");
    appDb.getRandomEntry(entryCard.displayEntry);

    $.mobile.changePage("#main-page");

  },

  //
  // Add a new entry
  //

  addEntry: function (entryText, cbfn) {

    console.log("Inside addEntry: " + entryText);

    if (entryText.length > 0) {

      // Add entry to the database, this posts to web too!

      appDb.addEntry(entryText, function (last_inserted, entryText, addedOn) {

        // Remember the last inserted

        app.last_inserted = last_inserted;

        if (cbfn !== undefined) {
          cbfn(last_inserted, entryText, addedOn);
        }
        
      });

    } else {

      toastr.warning("Nothing to say? Nothing to save.");

    }

    return null;

  }

};