var auth = {
  ref: null,
  init: function () {
    console.log("Initializing auth, creating Firebase object...");
    auth.ref = new Firebase("https://blistering-heat-2330.firebaseio.com");
    console.log("...done, done, done!");
  },
  googleAuth: function (authSuccess) {
    console.log("inside googleauth");
    auth.ref.authWithOAuthPopup("google", function (error, authData) {
      if (error) {
        console.log("Login failed!" + error);
        alert("Login Failed. " + error);
        return null;
      } else {
        console.log("The display name is: " + authData.google.displayName);
        var displayName = authData.google.displayName;

        console.log("UID is: " + authData.uid);
        var uid = authData.uid;

        uid = uid.replace(":", "-");

        console.log("Final UID after replacement is: " + uid);
        authSuccess(displayName, uid);
      }
    });
  }
};