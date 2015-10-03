var page_seemore = {

  init: function () {

    // Init

    $(document).on('pageshow', '#see-more-page', function(){
      console.log("Showing see-more-page");
      page_seemore.display();
    });

    // See random button: Show a random entry

    $('#btnSeeRandom').on('click', function(e){
      appDb.getRandomEntry(entryCard.displayEntry);
    });

    // See newer than what is currently displayed

    $("#btnSeeNewer").on("click", function(e) {
      console.log("Currently reading entry id: " + app.last_read);
      appDb.getNext(app.last_read, entryCard.displayEntry);
    });

    // See newer than what is currently displayed

    $("#btnSeeOlder").on("click", function(e) {
      console.log("Currently reading entry id: " + app.last_read);
      appDb.getPrev(app.last_read, entryCard.displayEntry);
    });

  },

  display: function () {

    // Update the current memory count 

    appDb.getEntryCount(function (count) {
      $(".totalEntries").text(count + " memories");
    });

    console.log("Getting random entry");
    appDb.getRandomEntry(entryCard.displayEntry);

  }
};
