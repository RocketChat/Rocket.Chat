// Request Gitlab credentials for the user
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
Gitlab.requestCredential = function (options, credentialRequestCompleteCallback) {
  // support both (options, callback) and (callback).
  if (!credentialRequestCompleteCallback && typeof options === 'function') {
    credentialRequestCompleteCallback = options;
    options = {};
  }

  var config = ServiceConfiguration.configurations.findOne({service: 'gitlab'});
  if (!config) {
    credentialRequestCompleteCallback && credentialRequestCompleteCallback(
      new ServiceConfiguration.ConfigError());
    return;
  }

  var credentialToken = Random.secret();
  var loginStyle = OAuth._loginStyle('gitlab', config, options);

  var loginUrl =
    Gitlab.ServerURL + '/oauth/authorize' +
    '?client_id=' + config.clientId +
    '&redirect_uri=' +  OAuth._redirectUri('gitlab', config) +
    '&response_type=code' +
    '&state=' + OAuth._stateParam(loginStyle, credentialToken, options.redirectUrl);

  OAuth.launchLogin({
    loginService: "gitlab",
    loginStyle: loginStyle,
    loginUrl: loginUrl,
    credentialRequestCompleteCallback: credentialRequestCompleteCallback,
    credentialToken: credentialToken,
    popupOptions: {width: 900, height: 450}
  });
};
