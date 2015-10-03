/*
 * Represents an entire card
 * Memory entry date
 * Memory content (text, audio, or image)
 * Label (Something you wrote...)
 */
var entryCard = {

  //
  // This is the only public function
  //

  displayEntry: function (row) {

    if (row !== null) {

      console.log("Entry date: " + row.added_on);
      console.log("Row entry: " + row.entry);

      entryCard.clearCard();
            
      // Update the UI  
      
      console.log("Updating the homepage with a random entry!");

      $(".entryDate").text($.timeago(row.added_on));
      $(".entryText").text(row.entry);

      $("#label-past-home").text("Something you wrote");

      // Does the entry have any attachments? Display them!

      console.log("Looking for attachments for entry ID: " + row.ID);

      appDb.getLastAttachmentByEntryId(row.ID, function (attachments) {

        if (attachments.length > 0) {

          // Aha, we have an attachment for this memory

          var attachmentRow = attachments.item(0);

          entryCard.showAttachment(attachmentRow.path);

        }
      });

      // Is this a memorable entry?
      console.log("Checking if this entry is memorable...");
      appDb.isEntryMemorable( function (isMemorable) {
        console.log("isMemorable is: " + isMemorable);
        if (isMemorable === true) {
          $(".starBtnRdOnly").toggleClass("fa-star");
        }
      }, row.ID);

      // Let app know. Useful for see next, see previous.

      app.last_read = row.ID;

    } else {
      console.log("No memories found"); //should never happen
    }
  },
  showAttachment: function (uri) {

    // Is this an audio attachment?

    if (uri.indexOf("aac") !== -1) {

      // Yes, show audio

      $(".entryAudio").attr("src", uri);
      $(".entryAudio").show();

    } else {

      // No, this is a image

      $(".entryImage").attr("src", uri);
      $(".entryImage").show();

    }
  },

  //
  // Reset
  //

  clearCard: function () {

    $(".entryDate").text("");
    $(".entryText").text("");

    $(".starBtnRdOnly").removeClass("fa-star");

    $(".entryAudio").attr("src", "");
    $(".entryAudio").hide();

    $(".entryImage").attr("src", "");
    $(".entryImage").hide();

  }
};