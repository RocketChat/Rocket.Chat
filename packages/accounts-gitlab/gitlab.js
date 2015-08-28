Accounts.oauth.registerService('gitlab');

if (Meteor.isClient) {
  Meteor.loginWithGitlab = function(options, callback) {
    // support a callback without options
    if (! callback && typeof options === "function") {
      callback = options;
      options = null;
    }

    var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
    Gitlab.requestCredential(options, credentialRequestCompleteCallback);
  };
} else {
  Accounts.addAutopublishFields({
    forLoggedInUser: ['services.gitlab'],
    forOtherUsers: ['services.gitlab.username']
  });
}
