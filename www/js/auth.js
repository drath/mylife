var auth = {
  ref: null,
  init: function () {
    auth.ref = new Firebase("https://blistering-heat-2330.firebaseio.com");
  },

  //
  // Use Firebase for google authentication. On success, store the user data 
  // in the Firebase database
  // TBD: Do we need to tighten this using Security rules in Firebase.com?
  //

  googleAuth: function (authSuccess) {

    // This will redirect to Google for authentication

    console.log("inside googleauth");

    auth.ref.authWithOAuthPopup("google", function (error, authData) {
      if (error) {

        // Unable to login, stay on the same page.

        toastr.warn("Login Failed. " + error);

        return null;

      } else {

        // Logged in, extract and store data

        console.log("The display name is: " + authData.google.displayName);

        var displayName = authData.google.displayName;
        var uid = authData.uid;
        uid = uid.replace(":", "-");

        // Save the user information in Firebase

        var usersRef = auth.ref.child("users");
        
        usersRef.child(displayName).set({
          uid: uid,
          googleAccessToken: authData.google.accessToken,
          authToken: authData.token
        });

        // Callback, so the app can progress to the next page

        authSuccess(displayName, uid);

      }
    });
  }
};