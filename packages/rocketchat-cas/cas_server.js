/* globals RoutePolicy, logger */
/* jshint newcap: false */

var fiber = Npm.require('fibers');
var url = Npm.require('url');
var CAS = Npm.require('cas');

var _casCredentialTokens = {};

RoutePolicy.declare('/_cas/', 'network');

var closePopup = function(res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	var content = '<html><head><script>window.close()</script></head></html>';
	res.end(content, 'utf-8');
};

var casTicket = function(req, token, callback) {

	// get configuration
	if (!RocketChat.settings.get('CAS_enabled')) {
		logger.error('Got ticket validation request, but CAS is not enabled');
		callback();
	}

	// get ticket and validate.
	var parsedUrl = url.parse(req.url, true);
	var ticketId = parsedUrl.query.ticket;
	var baseUrl = RocketChat.settings.get('CAS_base_url');
	logger.debug('Using CAS_base_url: ' + baseUrl);

	var cas = new CAS({
		base_url: baseUrl,
		service: Meteor.absoluteUrl() + '_cas/' + token
	});

	cas.validate(ticketId, function(err, status, username) {
		if (err) {
			logger.error('error when trying to validate ' + err.message);
		} else if (status) {
			logger.info('Validated user: ' + username);
			_casCredentialTokens[token] = { id: username };
		} else {
			logger.error('Unable to validate ticket: ' + ticketId);
		}

		callback();
	});

	return;
};

var middleware = function(req, res, next) {
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
		logger.error('Unexpected error : ' + err.message);
		closePopup(res);
	}
};

// Listen to incoming OAuth http requests
WebApp.connectHandlers.use(function(req, res, next) {
	// Need to create a fiber since we're using synchronous http calls and nothing
	// else is wrapping this in a fiber automatically
	fiber(function() {
		middleware(req, res, next);
	}).run();
});

var _hasCredential = function(credentialToken) {
	return _.has(_casCredentialTokens, credentialToken);
};

/*
 * Retrieve token and delete it to avoid replaying it.
 */
var _retrieveCredential = function(credentialToken) {
	var result = _casCredentialTokens[credentialToken];
	delete _casCredentialTokens[credentialToken];
	return result;
};

/*
 * Register a server-side login handle.
 * It is call after Accounts.callLoginMethod() is call from client.
 *
 */
Accounts.registerLoginHandler(function(options) {

	if (!options.cas) {
		return undefined;
	}

	if (!_hasCredential(options.cas.credentialToken)) {
		throw new Meteor.Error(Accounts.LoginCancelledError.numericError,
		'no matching login attempt found');
	}

	var result = _retrieveCredential(options.cas.credentialToken);
	options = { profile: { name: result.id } };

	// Search existing user by its external service id
	logger.debug('Looking up user with username: ' + result.id);
	var user = Meteor.users.findOne({ 'services.cas.external_id': result.id });

	if (user) {
		logger.debug('Using existing user for \'' + result.id + '\' with id: ' + user._id);
	} else {

		// Define new user
		var newUser = {
			username: result.id,
			active: true,
			globalRoles: ['user'],
			services: {
				cas: {
					external_id: result.id
				}
			}
		};

		// Create the user
		logger.debug('User \'' + result.id + '\'does not exist yet, creating it');
		var userId = Accounts.insertUserDoc({}, newUser);

		// Fetch and use it
		user = Meteor.users.findOne(userId);
		logger.debug('Created new user for \'' + result.id + '\' with id: ' + user._id);

		logger.debug('Joining user to default channels');
		Meteor.runAsUser(user._id, function() {
			Meteor.call('joinDefaultChannels');
		});

	}

	return { userId: user._id };
});
