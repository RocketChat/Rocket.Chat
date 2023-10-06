import url from 'url';

import { validate } from '@rocket.chat/cas-validate';
import { CredentialTokens, Rooms, Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { RoutePolicy } from 'meteor/routepolicy';
import { WebApp } from 'meteor/webapp';
import _ from 'underscore';

import { createRoom } from '../../lib/server/functions/createRoom';
import { _setRealName } from '../../lib/server/functions/setRealName';
import { settings } from '../../settings/server';
import { logger } from './cas_rocketchat';

RoutePolicy.declare('/_cas/', 'network');

const closePopup = function (res) {
	res.writeHead(200, { 'Content-Type': 'text/html' });
	const content = '<html><head><script>window.close()</script></head></html>';
	res.end(content, 'utf-8');
};

const casTicket = function (req, token, callback) {
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
	logger.debug(`Using CAS_base_url: ${baseUrl}`);

	validate(
		{
			base_url: baseUrl,
			version: cas_version,
			service: `${appUrl}/_cas/${token}`,
		},
		ticketId,
		async (err, status, username, details) => {
			if (err) {
				logger.error(`error when trying to validate: ${err.message}`);
			} else if (status) {
				logger.info(`Validated user: ${username}`);
				const user_info = { username };

				// CAS 2.0 attributes handling
				if (details && details.attributes) {
					_.extend(user_info, { attributes: details.attributes });
				}
				await CredentialTokens.create(token, user_info);
			} else {
				logger.error(`Unable to validate ticket: ${ticketId}`);
			}
			// logger.debug("Received response: " + JSON.stringify(details, null , 4));

			callback();
		},
	);
};

const middleware = function (req, res, next) {
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
		casTicket(req, credentialToken, () => {
			closePopup(res);
		});
	} catch (err) {
		logger.error({ msg: 'Unexpected error', err });
		closePopup(res);
	}
};

// Listen to incoming OAuth http requests
WebApp.connectHandlers.use((req, res, next) => {
	middleware(req, res, next);
});

/*
 * Register a server-side login handle.
 * It is call after Accounts.callLoginMethod() is call from client.
 *
 */
Accounts.registerLoginHandler('cas', async (options) => {
	if (!options.cas) {
		return undefined;
	}

	// TODO: Sync wrapper due to the chain conversion to async models
	const credentials = await CredentialTokens.findOneNotExpiredById(options.cas.credentialToken);
	if (credentials === undefined) {
		throw new Meteor.Error(Accounts.LoginCancelledError.numericError, 'no matching login attempt found');
	}

	const result = credentials.userInfo;
	const syncUserDataFieldMap = settings.get('CAS_Sync_User_Data_FieldMap').trim();
	const cas_version = parseFloat(settings.get('CAS_version'));
	const sync_enabled = settings.get('CAS_Sync_User_Data_Enabled');
	const trustUsername = settings.get('CAS_trust_username');
	const verified = settings.get('Accounts_Verify_Email_For_External_Accounts');
	const userCreationEnabled = settings.get('CAS_Creation_User_Enabled');

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
		_.each(result.attributes, (value, ext_name) => {
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

		_.each(attr_map, (source, int_name) => {
			// Source is our String to interpolate
			if (source && typeof source.valueOf() === 'string') {
				let replacedValue = source;
				_.each(ext_attrs, (value, ext_name) => {
					replacedValue = replacedValue.replace(`%${ext_name}%`, ext_attrs[ext_name]);
				});

				if (source !== replacedValue) {
					int_attrs[int_name] = replacedValue;
					logger.debug(`Sourced internal attribute: ${int_name} = ${replacedValue}`);
				} else {
					logger.debug(`Sourced internal attribute: ${int_name} skipped.`);
				}
			}
		});
	}

	// Search existing user by its external service id
	logger.debug(`Looking up user by id: ${result.username}`);
	// First, look for a user that has logged in from CAS with this username before
	let user = await Users.findOne({ 'services.cas.external_id': result.username });
	if (!user) {
		// If that user was not found, check if there's any Rocket.Chat user with that username
		// With this, CAS login will continue to work if the user is renamed on both sides and also if the user is renamed only on Rocket.Chat.
		// It'll also allow non-CAS users to switch to CAS based login
		if (trustUsername) {
			const username = new RegExp(`^${result.username}$`, 'i');
			user = await Users.findOne({ username });
			if (user) {
				// Update the user's external_id to reflect this new username.
				await Users.updateOne({ _id: user._id }, { $set: { 'services.cas.external_id': result.username } });
			}
		}
	}

	if (user) {
		logger.debug(`Using existing user for '${result.username}' with id: ${user._id}`);
		if (sync_enabled) {
			logger.debug('Syncing user attributes');
			// Update name
			if (int_attrs.name) {
				await _setRealName(user._id, int_attrs.name);
			}

			// Update email
			if (int_attrs.email) {
				await Users.updateOne({ _id: user._id }, { $set: { emails: [{ address: int_attrs.email, verified }] } });
			}
		}
	} else if (userCreationEnabled) {
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

		// Add username
		if (int_attrs.username) {
			_.extend(newUser, {
				username: int_attrs.username,
			});
		}

		// Add User.name
		if (int_attrs.name) {
			_.extend(newUser, {
				name: int_attrs.name,
			});
		}

		// Add email
		if (int_attrs.email) {
			_.extend(newUser, {
				emails: [{ address: int_attrs.email, verified }],
			});
		}

		// Create the user
		logger.debug(`User "${result.username}" does not exist yet, creating it`);
		const userId = Accounts.insertUserDoc({}, newUser);

		// Fetch and use it
		user = await Users.findOneById(userId);
		logger.debug(`Created new user for '${result.username}' with id: ${user._id}`);
		// logger.debug(JSON.stringify(user, undefined, 4));

		logger.debug(`Joining user to attribute channels: ${int_attrs.rooms}`);
		if (int_attrs.rooms) {
			const roomNames = int_attrs.rooms.split(',');
			for await (const roomName of roomNames) {
				if (roomName) {
					let room = await Rooms.findOneByNameAndType(roomName, 'c');
					if (!room) {
						room = await createRoom('c', roomName, user.username);
					}
				}
			}
		}
	} else {
		// Should fail as no user exist and can't be created
		logger.debug(`User "${result.username}" does not exist yet, will fail as no user creation is enabled`);
		throw new Meteor.Error(Accounts.LoginCancelledError.numericError, 'no matching user account found');
	}

	return { userId: user._id };
});
