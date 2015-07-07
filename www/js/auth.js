var auth = {
  ref: null,
  init: function () {
    console.log("Creating Firebase object...");
    auth.ref = new Firebase("https://blistering-heat-2330.firebaseio.com");
    console.log("...done!");
  },
  googleAuth: function (authSuccess) {
    console.log("inside googleauth");
    auth.ref.authWithOAuthPopup("google", function (error, authData) {
      if (error) {
        console.log("Login failed!" + error);
        alert("Login Failed. " + error);
        return null;
      } else {
        var displayName = authData.google.displayName;
        var uid = authData.uid;
        uid = uid.replace(":", "-");
        authSuccess(displayName, uid);
      }
    });
  }
};