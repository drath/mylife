//
// An object that wraps up some file operations - live move/copy/delete etc
//

var appFile = {
  fs: null,
  init: function () {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
      appFile.fs = fileSystem;
    });
  },
  // getFileSize: function (fileName, cbfn) {
  //   console.log("INSIDE getFile" + fileName);
  //   appFile.fs.root.getFile(fileName, {
  //     create: false,
  //     exclusive: false
  //   }, function (fileEntry) {
  //     fileEntry.file(function (file) {
  //       cbfn(file.size);
  //     }, appFile.fail);
  //   }, appFile.fail);
  // },
  moveFile2: function (srcFileEntry, destDirName, newName, cbfn) {
    appFile.fs.root.getDirectory(destDirName, {create: true}, function (destDirEntry) {
      srcFileEntry.moveTo(destDirEntry, newName, function (fileEntry) {
        console.log("File moved to: " + fileEntry.name);
        if (cbfn !== undefined) {
          cbfn(fileEntry);
        }
      }, util.printError);
    }, util.printError);
  }
};