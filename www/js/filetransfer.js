var fileTransfer = {
  // upload: function (fileEntry, cbfn) {
  //   console.log("Trying to upload: " + fileEntry.toURL());
  //   var fileName = fileEntry.toURL().substr(fileEntry.toURL().lastIndexOf('/') + 1);
  //   console.log("Filename is: " + fileName);

  //   var ft = new FileTransfer();
  //   var options = new FileUploadOptions();

  //   options.fileKey = "file";
  //   options.fileName = fileName;
  //   options.mimeType = "text/plain";
  //   options.chunkedMode = false;

  //   console.log("Calling upload...");

  //   ft.upload(fileEntry.toURL(),
  //     "http://176.58.121.237:8080/upload",
  //     function () {
  //       console.log("Upload succeeded!");
  //       if (cbfn !== undefined) {
  //         cbfn();
  //       }
  //     },
  //     function (error) {
  //       console.log("An error during upload has occurred: Code = " + error.code);
  //       toastr.error("Upload error: Code = " + error.code);
  //     },
  //     options, true);
  // },

  download: function(fileName, cbfn) {
    console.log("Downloading backup...");
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
      var ft = new FileTransfer();
      ft.download(
        "http://176.58.121.237:8080/download",
        fileSystem.root.toURL() + "/" + fileName,
        function (entry) {
          console.log("Download completed: " + entry.toURL());
          cbfn(entry);
        },
        function (error) {
          console.log("Download error code: " + error.code);
          toastr.error("Download error code: " + error.code);
        },
        false,
        {
          headers: {
            "fileName": fileName
          }
        }
      );
    });
  }
};