var Fiber = Npm.require('fibers');
var url = Npm.require('url');
var CAS = Npm.require('cas');

var _casCredentialTokens = {};

RoutePolicy.declare('/_cas/', 'network');

// Listen to incoming OAuth http requests
WebApp.connectHandlers.use(function(req, res, next) {
  // Need to create a Fiber since we're using synchronous http calls and nothing
  // else is wrapping this in a fiber automatically
  Fiber(function () {
    middleware(req, res, next);
  }).run();
});

middleware = function (req, res, next) {
  // Make sure to catch any exceptions because otherwise we'd crash
  // the runner
  try {
    var barePath = req.url.substring(0, req.url.indexOf('?'));
    var splitPath = barePath.split('/');

    // Any non-cas request will continue down the default
    // middlewares.
    if (splitPath[1] !== '_cas') {
      next();
      return;
    }

    // get auth token
    var credentialToken = splitPath[2];
    if (!credentialToken) {
      closePopup(res);
      return;
    }

    // validate ticket
    casTicket(req, credentialToken, function() {
      closePopup(res);
    });

  } catch (err) {
    console.log("account-cas: unexpected error : " + err.message);
    closePopup(res);
  }
};

var casTicket = function (req, token, callback) {
  // get configuration
  if (!Meteor.settings.cas && !Meteor.settings.cas.validate) {
    console.log("accounts-cas: unable to get configuration");
    callback();
  }

  // get ticket and validate.
  var parsedUrl = url.parse(req.url, true);
  var ticketId = parsedUrl.query.ticket;
  var baseUrl = Meteor.settings.cas.baseUrl;

  var cas = new CAS({
    base_url: Meteor.settings.cas.baseUrl,
    service: Meteor.absoluteUrl() + "_cas/" + token
  });

  cas.validate(ticketId, function(err, status, username) {
    if (err) {
      console.log("accounts-cas: error when trying to validate " + err);
    } else {
      if (status) {
        console.log("accounts-cas: user validated " + username);
        _casCredentialTokens[token] = { id: username };
      } else {
        console.log("accounts-cas: unable to validate " + ticketId);
      }
    }

    callback();
  });
  console.log("Validated: " + ticketId);

  return; 
};

/*
 * Register a server-side login handle.
 * It is call after Accounts.callLoginMethod() is call from client.
 *
 */
 Accounts.registerLoginHandler(function (options) {

  if (!options.cas)
    return undefined;

  if (!_hasCredential(options.cas.credentialToken)) {
    throw new Meteor.Error(Accounts.LoginCancelledError.numericError,
      'no matching login attempt found');
  }

  var result = _retrieveCredential(options.cas.credentialToken);
  var options = { profile: { name: result.id } };
  //var user = Accounts.updateOrCreateUserFromExternalService("cas", result, options);

  var user = Meteor.users.findOne({ 'username': result.id });

  if (!user) {
	var newUser = {
		username: result.id,
		active: true,
		globalRoles: ['user'],
	};

	var userId = Accounts.insertUserDoc({}, newUser);
	user = Meteor.users.findOne(userId);
  }

  console.log("Using user: " + user._id);

  return { userId: user._id };
});

var _hasCredential = function(credentialToken) {
  return _.has(_casCredentialTokens, credentialToken);
}

/*
 * Retrieve token and delete it to avoid replaying it.
 */
var _retrieveCredential = function(credentialToken) {
  var result = _casCredentialTokens[credentialToken];
  delete _casCredentialTokens[credentialToken];
  return result;
}

var closePopup = function(res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  var content = '<html><head><script>window.close()</script></head></html>';
  res.end(content, 'utf-8');
}
