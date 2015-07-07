var util = {
  objDump: function (obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        console.log("Key: " + key + " Value: " + obj[key]);
        if (key === "auth" || key === "google") {
          this.objDump(obj[key]);
        }
      }
    }
  }
};