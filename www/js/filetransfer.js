var fileTransfer = {
  upload: function (fileEntry) {
    console.log("Trying to upload: " + fileEntry.toURL());
    var fileName = fileEntry.toURL().substr(fileEntry.toURL().lastIndexOf('/') + 1);
    console.log("Filename is: " + fileName);

    var ft = new FileTransfer();
    var options = new FileUploadOptions();

    options.fileKey = "file";
    options.fileName = fileName;
    options.mimeType = "text/plain";
    options.chunkedMode = false;

    console.log("Calling upload...");

    ft.upload(fileEntry.toURL(),
      "http://176.58.121.237:8080/upload",
      function () {
        console.log("Upload succeeded!");
        alert("Backup succeeded!");
      },
      function (error) {
        console.log("An error during upload has occurred: Code = " + error.code);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
      },
      options, true);

    console.log("upload:end");
  },

  download: function(relativePath, decryptFile) {
    console.log("Downloading backup...");
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
      var ft = new FileTransfer();
      ft.download(
        "http://176.58.121.237:8080/download",
        fileSystem.root.toURL() + "/" + relativePath,
        function (entry) {
          console.log("Download completed: " + entry.toURL());
          decryptFile();
        },
        function (error) {
          console.log("Download error code: " + error.code);
          console.log("Download error source: " + error.source);
          console.log("Download error target: " + error.target);
        }
      );
    });
  }
};