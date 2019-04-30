import { Meteor } from 'meteor/meteor';
import { SHA256 } from 'meteor/sha';
import { SyncedCron } from 'meteor/littledata:synced-cron';
import { Accounts } from 'meteor/accounts-base';
import { Logger } from '../../logger';
import { _setRealName } from '../../lib';
import { Users } from '../../models';
import { settings } from '../../settings';
import { hasRole } from '../../authorization';
import _ from 'underscore';

const logger = new Logger('CROWD', {});

function fallbackDefaultAccountSystem(bind, username, password) {
	if (typeof username === 'string') {
		if (username.indexOf('@') === -1) {
			username = { username };
		} else {
			username = { email: username };
		}
	}

	logger.info('Fallback to default account system', username);

	const loginRequest = {
		user: username,
		password: {
			digest: SHA256(password),
			algorithm: 'sha-256',
		},
	};

	return Accounts._runLoginHandlers(bind, loginRequest);
}

export class CROWD {
	constructor() {
		const AtlassianCrowd = require('atlassian-crowd');
		let url = settings.get('CROWD_URL');

		this.options = {
			crowd: {
				base: !/\/$/.test(url) ? url += '/' : url,
			},
			application: {
				name: settings.get('CROWD_APP_USERNAME'),
				password: settings.get('CROWD_APP_PASSWORD'),
			},
			rejectUnauthorized: settings.get('CROWD_Reject_Unauthorized'),
		};

		this.crowdClient = new AtlassianCrowd(this.options);

		this.crowdClient.user.authenticateSync = Meteor.wrapAsync(this.crowdClient.user.authenticate, this);
		this.crowdClient.user.findSync = Meteor.wrapAsync(this.crowdClient.user.find, this);
		this.crowdClient.searchSync = Meteor.wrapAsync(this.crowdClient.search, this);
		this.crowdClient.pingSync = Meteor.wrapAsync(this.crowdClient.ping, this);
	}

	checkConnection() {
		this.crowdClient.pingSync();
	}

	fetchCrowdUser(crowd_username) {
		const userResponse = this.crowdClient.user.findSync(crowd_username);

		return {
			displayname: userResponse['display-name'],
			username: userResponse.name,
			email: userResponse.email,
			active: userResponse.active,
			crowd_username,
		};
	}

	authenticate(username, password) {
		if (!username || !password) {
			logger.error('No username or password');
			return;
		}

		logger.info('Extracting crowd_username');
		let user = null;
		let crowd_username = username;

		if (username.indexOf('@') !== -1) {
			const email = username;

			user = Meteor.users.findOne({ 'emails.address': email }, { fields: { username: 1, crowd_username: 1, crowd: 1 } });
			if (user) {
				crowd_username = user.crowd_username;
			} else {
				logger.debug('Could not find a user by email', username);
			}
		}

		if (user == null) {
			user = Meteor.users.findOne({ username }, { fields: { username: 1, crowd_username: 1, crowd: 1 } });
			if (user) {
				crowd_username = user.crowd_username;
			} else {
				logger.debug('Could not find a user by username');
			}
		}

		if (user == null) {
			user = Meteor.users.findOne({ crowd_username: username }, { fields: { username: 1, crowd_username: 1, crowd: 1 } });
			if (user) {
				crowd_username = user.crowd_username;
			} else {
				logger.debug('Could not find a user with by crowd_username', username);
			}
		}

		if (user && !crowd_username) {
			logger.debug('Local user found, redirecting to fallback login');
			return {
				crowd: false,
			};
		}

		if (!user && crowd_username) {
			logger.debug('New user. User is not synced yet.');
		}
		logger.debug('Going to crowd:', crowd_username);
		const auth = this.crowdClient.user.authenticateSync(crowd_username, password);

		if (!auth) {
			return;
		}

		const crowdUser = this.fetchCrowdUser(crowd_username);

		if (user && settings.get('CROWD_Allow_Custom_Username') === true) {
			crowdUser.username = user.username;
		}

		if (user) {
			crowdUser._id = user._id;
		}
		crowdUser.password = password;

		return crowdUser;
	}

	syncDataToUser(crowdUser, id) {
		const self = this;
		const user = {
			username: self.cleanUsername(crowdUser.username),
			crowd_username: crowdUser.crowd_username,
			emails: [{
				address: crowdUser.email,
				verified: true,
			}],
			active: crowdUser.active,
			crowd: true,
		};

		if (crowdUser.password) {
			Accounts.setPassword(id, crowdUser.password, {
				logout: false,
			});

			Users.unsetRequirePasswordChange(id);
		}

		if (crowdUser.displayname) {
			_setRealName(id, crowdUser.displayname);
		}

		Meteor.users.update(id, {
			$set: user,
		});
	}

	sync() {
		// if crowd is disabled bail out
		if (settings.get('CROWD_Enable') !== true) {
			return;
		}

		const self = this;
		const users = Users.findCrowdUsers() || [];

		logger.info('Sync started...');

		users.forEach(function(user) {
			let crowd_username = user.hasOwnProperty('crowd_username') ? user.crowd_username : user.username;
			logger.info('Syncing user', crowd_username);

			let crowdUser = null;

			try {
				crowdUser = self.fetchCrowdUser(crowd_username);
			} catch (error) {
				logger.debug(error);
				logger.error('Could not sync user with username', crowd_username);

				const email = user.emails[0].address;
				logger.info('Attempting to find for user by email', email);

				const response = self.crowdClient.searchSync('user', `email=" ${ email } "`);
				if (!response || response.users.length === 0) {
					logger.warning('Could not find user in CROWD with username or email:', crowd_username, email);
					return;
				}
				crowd_username = response.users[0].name;
				logger.info('User found by email. Syncing user', crowd_username);

				crowdUser = self.fetchCrowdUser(crowd_username);
			}

			if (settings.get('CROWD_Allow_Custom_Username') === true) {
				crowdUser.username = user.username;
			}

			self.syncDataToUser(crowdUser, user._id);
		});
	}

	cleanUsername(username) {
		if (settings.get('CROWD_Clean_Usernames') === true) {
			return username.split('@')[0];
		}
		return username;
	}

	updateUserCollection(crowdUser) {
		const userQuery = {
			_id: crowdUser._id,
		};

		// find our existing user if they exist
		const user = Meteor.users.findOne(userQuery);

		if (user) {
			const stampedToken = Accounts._generateStampedLoginToken();

			Meteor.users.update(user._id, {
				$push: {
					'services.resume.loginTokens': Accounts._hashStampedToken(stampedToken),
				},
			});

			this.syncDataToUser(crowdUser, user._id);

			return {
				userId: user._id,
				token: stampedToken.token,
			};
		}

		// Attempt to create the new user
		try {
			crowdUser._id = Accounts.createUser(crowdUser);

			// sync the user data
			this.syncDataToUser(crowdUser, crowdUser._id);

			return {
				userId: crowdUser._id,
			};
		} catch (error) {
			logger.error('Error creating new crowd user.', error.message);
		}
	}
}

Accounts.registerLoginHandler('crowd', function(loginRequest) {
	if (!loginRequest.crowd) {
		return undefined;
	}

	logger.info('Init CROWD login', loginRequest.username);

	if (settings.get('CROWD_Enable') !== true) {
		return fallbackDefaultAccountSystem(this, loginRequest.username, loginRequest.crowdPassword);
	}

	try {
		const crowd = new CROWD();
		const user = crowd.authenticate(loginRequest.username, loginRequest.crowdPassword);

		if (user && (user.crowd === false)) {
			logger.debug(`User ${ loginRequest.username } is not a valid crowd user, falling back`);
			return fallbackDefaultAccountSystem(this, loginRequest.username, loginRequest.crowdPassword);
		}

		if (!user) {
			logger.debug(`User ${ loginRequest.username } is not allowd to access Rocket.Chat`);
			return new Meteor.Error('not-authorized', 'User is not authorized by crowd');
		}

		return crowd.updateUserCollection(user);
	} catch (error) {
		logger.debug(error);
		logger.error('Crowd user not authenticated due to an error');
	}
});


const jobName = 'CROWD_Sync';

const addCronJob = _.debounce(Meteor.bindEnvironment(function addCronJobDebounced() {
	if (settings.get('CROWD_Sync_User_Data') !== true) {
		logger.info('Disabling CROWD Background Sync');
		if (SyncedCron.nextScheduledAtDate(jobName)) {
			SyncedCron.remove(jobName);
		}
		return;
	}

	const crowd = new CROWD();

	if (settings.get('CROWD_Sync_Interval')) {
		logger.info('Enabling CROWD Background Sync');
		SyncedCron.add({
			name: jobName,
			schedule: (parser) => parser.text(settings.get('CROWD_Sync_Interval')),
			job() {
				crowd.sync();
			},
		});
		SyncedCron.start();
	}
}), 500);

Meteor.startup(() => {
	Meteor.defer(() => {
		settings.get('CROWD_Sync_Interval', addCronJob);
		settings.get('CROWD_Sync_User_Data', addCronJob);
	});
});

Meteor.methods({
	crowd_test_connection() {
		const user = Meteor.user();
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'crowd_test_connection' });
		}

		if (!hasRole(user._id, 'admin')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'crowd_test_connection' });
		}

		if (settings.get('CROWD_Enable') !== true) {
			throw new Meteor.Error('crowd_disabled');
		}

		try {
			const crowd = new CROWD();
			crowd.checkConnection();

			return {
				message: 'Connection success',
				params: [],
			};
		} catch (error) {
			logger.error('Invalid crowd connection details, check the url and application username/password and make sure this server is allowed to speak to crowd');
			throw new Meteor.Error('Invalid connection details', '', { method: 'crowd_test_connection' });
		}
	},
	crowd_sync_users() {
		const user = Meteor.user();
		if (settings.get('CROWD_Enable') !== true) {
			throw new Meteor.Error('crowd_disabled');
		}

		if (!hasRole(user._id, 'admin')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'crowd_sync_users' });
		}

		try {
			const crowd = new CROWD();
			const startTime = Date.now();
			crowd.sync();
			const stopTime = Date.now();
			const actual = Math.ceil((stopTime - startTime) / 1000);

			return {
				message: `User data synced in ${ actual } seconds`,
				params: [],
			};
		} catch (error) {
			logger.error('Error syncing user data. ', error.message);
			throw new Meteor.Error('Error syncing user data', '', { method: 'crowd_sync_users' });
		}
	},
});
