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
  getFileSize: function (fileName, cbfn) {
    console.log("INSIDE getFile" + fileName);
    appFile.fs.root.getFile(fileName, {
      create: false,
      exclusive: false
    }, function (fileEntry) {
      fileEntry.file(function (file) {
        cbfn(file.size);
      }, appFile.fail);
    }, appFile.fail);
  },
  // Move the file from current location to a location specified in destDirName
  moveFile: function (srcFileEntry, destDirName, cbfn) {
    appFile.fs.root.getDirectory(destDirName, {create: true}, function (destDirEntry) {
      srcFileEntry.moveTo(destDirEntry, null, function (fileEntry) {
        console.log("File moved to: " + fileEntry.name);
        if (cbfn !== undefined) {
          cbfn(fileEntry);
        }
      }, appFile.fail);
    }, appFile.fail);
  },
  moveFile2: function (srcFileEntry, destDirName, newName, cbfn) {
    appFile.fs.root.getDirectory(destDirName, {create: true}, function (destDirEntry) {
      srcFileEntry.moveTo(destDirEntry, newName, function (fileEntry) {
        console.log("File moved to: " + fileEntry.name);
        if (cbfn !== undefined) {
          cbfn(fileEntry);
        }
      }, appFile.fail);
    }, appFile.fail);
  },
  renameFile: function (srcFileEntry, newName, cbfn) {
    console.log("Calling getParent of " + srcFileEntry.name);
    srcFileEntry.getParent(function (parentDirectory) {
      console.log("Parent name: " + parentDirectory.name);
      srcFileEntry.moveTo(parentDirectory, newName, function (fileEntry) {
        console.log("File renamed to: " + fileEntry.fullPath);
        if (cbfn !== undefined) {
          cbfn(fileEntry);
        }
      }, appFile.fail);
    }, appFile.fail);
  },
  fail: function (error) {
    switch (error.code) {
      case FileError.ENCODING_ERR:
        console.log("ENCODING_ERR!");
        toastr.error("ENCODING_ERR!");
        break;
      case FileError.NOT_FOUND_ERR:
        console.log("NOT_FOUND_ERR!");
        break;
      case FileError.SECURITY_ERR:
        console.log("SECURITY_ERR");
        toastr.error("SECURITY_ERR");
        break;
      case FileError.ABORT_ERR:
        console.log("ABORT_ERR");
        toastr.error("ABORT_ERR");
        break;
      case FileError.NOT_READABLE_ERR:
        console.log("NOT_READABLE_ERR");
        toastr.error("NOT_READABLE_ERR");
        break;
      case FileError.ENCODING_ERR:
        console.log("ENCODING_ERR");
        toastr.error("ENCODING_ERR");
        break;
      case FileError.NO_MODIFICATION_ALLOWED_ERR:
        console.log("NO_MODIFICATION_ALLOWED_ERR");
        toastr.error("NO_MODIFICATION_ALLOWED_ERR");
        break;
      case FileError.INVALID_STATE_ERR:
        console.log("INVALID_STATE_ERR");
        toastr.error("INVALID_STATE_ERR");
        break;
      case FileError.SYNTAX_ERR:
        console.log("SYNTAX_ERR");
        toastr.error("SYNTAX_ERR");
        break;
      case FileError.INVALID_MODIFICATION_ERR:
        console.log("INVALID_MODIFICATION_ERR");
        toastr.error("INVALID_MODIFICATION_ERR");
        break;
      case FileError.QUOTA_EXCEEDED_ERR:
        console.log("QUOTA_EXCEEDED_ERR");
        toastr.error("QUOTA_EXCEEDED_ERR");
        break;
      case FileError.TYPE_MISMATCH_ERR:
        console.log("TYPE_MISMATCH_ERR");
        toastr.error("TYPE_MISMATCH_ERR");
        break;
      case FileError.PATH_EXISTS_ERR:
        console.log("PATH_EXISTS_ERR");
        toastr.error("PATH_EXISTS_ERR");
        break;
      default:
        console.log("Unknown error");
        toastr.error("Unknown error during file operation.");
    }
  }
};