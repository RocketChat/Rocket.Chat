OAuth.registerService('gitlab', 2, null, function(query) {

  var accessToken = getAccessToken(query);
	console.log('at: ' + accessToken);
  var identity = getIdentity(accessToken);
	console.log('id: ' + JSON.stringify(identity));
  var primaryEmail = identity.email;
	console.log('primay: ' + JSON.stringify(primaryEmail));

  return {
    serviceData: {
      id: identity.id,
      accessToken: OAuth.sealSecret(accessToken),
      email: identity.email || '',
      username: identity.username,
      emails: [identity.email]
    },
    options: {profile: {name: identity.username}}
  };
});


var userAgent = "Meteor";
if (Meteor.release)
  userAgent += "/" + Meteor.release;

var getAccessToken = function (query) {
  var config = ServiceConfiguration.configurations.findOne({service: 'gitlab'});
  if (!config)
    throw new ServiceConfiguration.ConfigError();


  var response;
  try {
    response = HTTP.post(
      Gitlab.ServerURL + "/oauth/token", {
        headers: {
          Accept: 'application/json',
          "User-Agent": userAgent
        },
        params: {
          code: query.code,
          client_id: config.clientId,
          client_secret: OAuth.openSecret(config.secret),
          redirect_uri: OAuth._redirectUri('gitlab', config),
           grant_type: 'authorization_code',
		state: query.state
        }
      });
  } catch (err) {
    throw _.extend(new Error("Failed to complete OAuth handshake with Gitlab. " + err.message),
                   {response: err.response});
  }
  if (response.data.error) { // if the http response was a json object with an error attribute
    throw new Error("Failed to complete OAuth handshake with Gitlab. " + response.data.error);
  } else {
    return response.data.access_token;
  }
};

var getIdentity = function (accessToken) {
  try {
    return HTTP.get(
      Gitlab.ServerURL + "/api/v3/user", {
        headers: {"User-Agent": userAgent}, // http://doc.gitlab.com/ce/api/users.html#Current-user
        params: {access_token: accessToken}
      }).data;
  } catch (err) {
    throw _.extend(new Error("Failed to fetch identity from Gitlab. " + err.message),
                   {response: err.response});
  }
};


Gitlab.retrieveCredential = function(credentialToken, credentialSecret) {
  return OAuth.retrieveCredential(credentialToken, credentialSecret);
};
