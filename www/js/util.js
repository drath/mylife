var util = {
  objDump: function (obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        console.log("Key: " + key + " Value: " + obj[key]);
      }
    }
  },
  getNameFromPath: function (fullPathName) {
    return fullPathName.replace(/^.*[\\\/]/, '');
  },
  // FIXME: Remove from here
  printError: function (msg, error) {
    console.log("Inside printError");
    console.log(msg);
    if ((msg !== undefined) && (msg.length > 0)) {
      console.log(msg);
    }

    switch (error.code) {
      case FileError.ENCODING_ERR:
        console.log("ENCODING_ERR!");
        break;
      case FileError.NOT_FOUND_ERR:
        console.log("NOT_FOUND_ERR!");
        break;
      case FileError.SECURITY_ERR:
        console.log("SECURITY_ERR");
        break;
      case FileError.ABORT_ERR:
        console.log("ABORT_ERR");
        break;
      case FileError.NOT_READABLE_ERR:
        console.log("NOT_READABLE_ERR");
        break;
      case FileError.ENCODING_ERR:
        console.log("ENCODING_ERR");
        break;
      case FileError.NO_MODIFICATION_ALLOWED_ERR:
        console.log("NO_MODIFICATION_ALLOWED_ERR");
        break;
      case FileError.INVALID_STATE_ERR:
        console.log("INVALID_STATE_ERR");
        break;
      case FileError.SYNTAX_ERR:
        console.log("SYNTAX_ERR");
        break;
      case FileError.INVALID_MODIFICATION_ERR:
        console.log("INVALID_MODIFICATION_ERR");
        break;
      case FileError.QUOTA_EXCEEDED_ERR:
        console.log("QUOTA_EXCEEDED_ERR");
        break;
      case FileError.TYPE_MISMATCH_ERR:
        console.log("TYPE_MISMATCH_ERR");
        break;
      case FileError.PATH_EXISTS_ERR:
        console.log("PATH_EXISTS_ERR");
        break;
      default:
        console.log("Unknown error");
    }
  }
};