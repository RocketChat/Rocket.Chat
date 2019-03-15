import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Random } from 'meteor/random';
import { WebApp } from 'meteor/webapp';
import { settings } from '../../settings';
import { RoutePolicy } from 'meteor/routepolicy';
import { Rooms, Subscriptions, CredentialTokens } from '../../models';
import { _setRealName } from '../../lib';
import { logger } from './cas_rocketchat';
import _ from 'underscore';
import fiber from 'fibers';
import url from 'url';
import CAS from 'cas';

RoutePolicy.declare('/_cas/', 'network');

const closePopup = function(res) {
	res.writeHead(200, { 'Content-Type': 'text/html' });
	const content = '<html><head><script>window.close()</script></head></html>';
	res.end(content, 'utf-8');
};

const casTicket = function(req, token, callback) {

	// get configuration
	if (!settings.get('CAS_enabled')) {
		logger.error('Got ticket validation request, but CAS is not enabled');
		callback();
	}

	// get ticket and validate.
	const parsedUrl = url.parse(req.url, true);
	const ticketId = parsedUrl.query.ticket;
	const baseUrl = settings.get('CAS_base_url');
	const cas_version = parseFloat(settings.get('CAS_version'));
	const appUrl = Meteor.absoluteUrl().replace(/\/$/, '') + __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
	logger.debug(`Using CAS_base_url: ${ baseUrl }`);

	const cas = new CAS({
		base_url: baseUrl,
		version: cas_version,
		service: `${ appUrl }/_cas/${ token }`,
	});

	cas.validate(ticketId, Meteor.bindEnvironment(function(err, status, username, details) {
		if (err) {
			logger.error(`error when trying to validate: ${ err.message }`);
		} else if (status) {
			logger.info(`Validated user: ${ username }`);
			const user_info = { username };

			// CAS 2.0 attributes handling
			if (details && details.attributes) {
				_.extend(user_info, { attributes: details.attributes });
			}
			CredentialTokens.create(token, user_info);
		} else {
			logger.error(`Unable to validate ticket: ${ ticketId }`);
		}
		// logger.debug("Receveied response: " + JSON.stringify(details, null , 4));

		callback();
	}));

	return;
};

const middleware = function(req, res, next) {
	// Make sure to catch any exceptions because otherwise we'd crash
	// the runner
	try {
		const barePath = req.url.substring(0, req.url.indexOf('?'));
		const splitPath = barePath.split('/');

		// Any non-cas request will continue down the default
		// middlewares.
		if (splitPath[1] !== '_cas') {
			next();
			return;
		}

		// get auth token
		const credentialToken = splitPath[2];
		if (!credentialToken) {
			closePopup(res);
			return;
		}

		// validate ticket
		casTicket(req, credentialToken, function() {
			closePopup(res);
		});

	} catch (err) {
		logger.error(`Unexpected error : ${ err.message }`);
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

/*
 * Register a server-side login handle.
 * It is call after Accounts.callLoginMethod() is call from client.
 *
 */
Accounts.registerLoginHandler(function(options) {

	if (!options.cas) {
		return undefined;
	}

	const credentials = CredentialTokens.findOneById(options.cas.credentialToken);
	if (credentials === undefined) {
		throw new Meteor.Error(Accounts.LoginCancelledError.numericError,
			'no matching login attempt found');
	}

	const result = credentials.userInfo;
	const syncUserDataFieldMap = settings.get('CAS_Sync_User_Data_FieldMap').trim();
	const cas_version = parseFloat(settings.get('CAS_version'));
	const sync_enabled = settings.get('CAS_Sync_User_Data_Enabled');

	// We have these
	const ext_attrs = {
		username: result.username,
	};

	// We need these
	const int_attrs = {
		email: undefined,
		name: undefined,
		username: undefined,
		rooms: undefined,
	};

	// Import response attributes
	if (cas_version >= 2.0) {
		// Clean & import external attributes
		_.each(result.attributes, function(value, ext_name) {
			if (value) {
				ext_attrs[ext_name] = value[0];
			}
		});
	}

	// Source internal attributes
	if (syncUserDataFieldMap) {

		// Our mapping table: key(int_attr) -> value(ext_attr)
		// Spoken: Source this internal attribute from these external attributes
		const attr_map = JSON.parse(syncUserDataFieldMap);

		_.each(attr_map, function(source, int_name) {
			// Source is our String to interpolate
			if (_.isString(source)) {
				let replacedValue = source;
				_.each(ext_attrs, function(value, ext_name) {
					replacedValue = replacedValue.replace(`%${ ext_name }%`, ext_attrs[ext_name]);
				});

				if (source !== replacedValue) {
					int_attrs[int_name] = replacedValue;
					logger.debug(`Sourced internal attribute: ${ int_name } = ${ replacedValue }`);
				} else {
					logger.debug(`Sourced internal attribute: ${ int_name } skipped.`);
				}
			}
		});
	}

	// Search existing user by its external service id
	logger.debug(`Looking up user by id: ${ result.username }`);
	// First, look for a user that has logged in from CAS with this username before
	let user = Meteor.users.findOne({ 'services.cas.external_id': result.username });
	if (!user) {
		// If that user was not found, check if there's any CAS user that is currently using that username on Rocket.Chat
		// With this, CAS login will continue to work if the user is renamed on both sides and also if the user is renamed only on Rocket.Chat.
		const username = new RegExp(`^${ result.username }$`, 'i');
		user = Meteor.users.findOne({ 'services.cas.external_id': { $exists: true }, username });
		if (user) {
			// Update the user's external_id to reflect this new username.
			Meteor.users.update(user, { $set: { 'services.cas.external_id': result.username } });
		}
	}

	if (user) {
		logger.debug(`Using existing user for '${ result.username }' with id: ${ user._id }`);
		if (sync_enabled) {
			logger.debug('Syncing user attributes');
			// Update name
			if (int_attrs.name) {
				_setRealName(user._id, int_attrs.name);
			}

			// Update email
			if (int_attrs.email) {
				Meteor.users.update(user, { $set: { emails: [{ address: int_attrs.email, verified: true }] } });
			}
		}
	} else {

		// Define new user
		const newUser = {
			username: result.username,
			active: true,
			globalRoles: ['user'],
			emails: [],
			services: {
				cas: {
					external_id: result.username,
					version: cas_version,
					attrs: int_attrs,
				},
			},
		};

		// Add User.name
		if (int_attrs.name) {
			_.extend(newUser, {
				name: int_attrs.name,
			});
		}

		// Add email
		if (int_attrs.email) {
			_.extend(newUser, {
				emails: [{ address: int_attrs.email, verified: true }],
			});
		}

		// Create the user
		logger.debug(`User "${ result.username }" does not exist yet, creating it`);
		const userId = Accounts.insertUserDoc({}, newUser);

		// Fetch and use it
		user = Meteor.users.findOne(userId);
		logger.debug(`Created new user for '${ result.username }' with id: ${ user._id }`);
		// logger.debug(JSON.stringify(user, undefined, 4));

		logger.debug(`Joining user to attribute channels: ${ int_attrs.rooms }`);
		if (int_attrs.rooms) {
			_.each(int_attrs.rooms.split(','), function(room_name) {
				if (room_name) {
					let room = Rooms.findOneByNameAndType(room_name, 'c');
					if (!room) {
						room = Rooms.createWithIdTypeAndName(Random.id(), 'c', room_name);
					}

					if (!Subscriptions.findOneByRoomIdAndUserId(room._id, userId)) {
						Subscriptions.createWithRoomAndUser(room, user, {
							ts: new Date(),
							open: true,
							alert: true,
							unread: 1,
							userMentions: 1,
							groupMentions: 0,
						});
					}
				}
			});
		}

	}

	return { userId: user._id };
});
