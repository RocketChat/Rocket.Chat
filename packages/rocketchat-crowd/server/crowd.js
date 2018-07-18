/* globals CROWD, SyncedCron */
/* eslint new-cap: [2, {"capIsNewExceptions": ["SHA256"]}] */
import _ from 'underscore';

const logger = new Logger('CROWD', {});

function fallbackDefaultAccountSystem(bind, username, password) {
	if (typeof username === 'string') {
		if (username.indexOf('@') === -1) {
			username = {username};
		} else {
			username = {email: username};
		}
	}

	logger.info('Fallback to default account system', username);

	const loginRequest = {
		user: username,
		password: {
			digest: SHA256(password),
			algorithm: 'sha-256'
		}
	};

	return Accounts._runLoginHandlers(bind, loginRequest);
}

const CROWD = class CROWD {
	constructor() {
		const AtlassianCrowd = require('atlassian-crowd');
		let url = RocketChat.settings.get('CROWD_URL');
		const urlLastChar = url.slice(-1);

		if (urlLastChar !== '/') {
			url += '/';
		}

		this.options = {
			crowd: {
				base: url
			},
			application: {
				name: RocketChat.settings.get('CROWD_APP_USERNAME'),
				password: RocketChat.settings.get('CROWD_APP_PASSWORD')
			},
			rejectUnauthorized: RocketChat.settings.get('CROWD_Reject_Unauthorized')
		};

		this.crowdClient = new AtlassianCrowd(this.options);

		this.crowdClient.user.authenticateSync = Meteor.wrapAsync(this.crowdClient.user.authenticate, this);
		this.crowdClient.user.findSync = Meteor.wrapAsync(this.crowdClient.user.find, this);
		this.crowdClient.pingSync = Meteor.wrapAsync(this.crowdClient.ping, this);
	}

	checkConnection() {
		this.crowdClient.pingSync();
	}

	authenticate(username, password) {
		if (!username || !password) {
			logger.error('No username or password');
			return;
		}

		logger.info('Going to crowd:', username);
		const auth = this.crowdClient.user.authenticateSync(username, password);

		if (!auth) {
			return;
		}

		const userResponse = this.crowdClient.user.findSync(username);

		return {
			displayname: userResponse['display-name'],
			username: userResponse.name,
			email: userResponse.email,
			password,
			active: userResponse.active
		};
	}

	static syncDataToUser(crowdUser, id) {
		const user = {
			username: crowdUser.username,
			emails: [{
				address : crowdUser.email,
				verified: true
			}],
			password: crowdUser.password,
			active: crowdUser.active,
			crowd: true
		};

		if (crowdUser.displayname) {
			RocketChat._setRealName(id, crowdUser.displayname);
		}

		Meteor.users.update(id, {
			$set: user
		});
	}

	fetchCrowdUser(user) {
		try {
			const userResponse = this.crowdClient.user.findSync(user.username);

			if (userResponse) {
				return {
					displayname: userResponse['display-name'],
					username: userResponse.name,
					email: userResponse.email,
					password: userResponse.password,
					active: userResponse.active
				};
			}
		} catch (e) {
			if (e.hasOwnProperty('type') && e.type === 'USER_NOT_FOUND') {
				logger.info('Disable not found user', user.username);

				return {
					username: user.username,
					email: user.emails.length ? user.emails[0].address : '',
					password: user.password,
					active: false,
				};
			} else {
				logger.error('error fetchCrowdUser', user.username, e);
			}
		}
	}

	sync() {
		if (RocketChat.settings.get('CROWD_Enable') !== true) {
			return;
		}

		logger.info('Sync started');

		const self = this;
		const users = RocketChat.models.Users.findCrowdUsers();

		if (users) {
			users.forEach(function(user) {
				logger.info('Syncing user', user.username);
				const crowdUser = self.fetchCrowdUser(user);

				if (typeof crowdUser !== 'undefined') {
					CROWD.syncDataToUser(crowdUser, user._id);
				}
			});
		}
	}


	static addNewUser(crowdUser) {
		const userQuery = {
			crowd: true,
			username: crowdUser.username
		};

		// find our existinmg user if they exist
		const user = Meteor.users.findOne(userQuery);

		if (user) {
			const stampedToken = Accounts._generateStampedLoginToken();

			Meteor.users.update(user._id, {
				$push: {
					'services.resume.loginTokens': Accounts._hashStampedToken(stampedToken)
				}
			});

			CROWD.syncDataToUser(crowdUser, user._id);

			return {
				userId: user._id,
				token: stampedToken.token
			};
		} else {
			try {
				crowdUser._id = Accounts.createUser(crowdUser);
			} catch (error) {
				logger.info('Error creating new user for crowd user', error);
			}

			const updateUser = {
				name: crowdUser.displayname,
				crowd: true,
				active: crowdUser.active
			};

			Meteor.users.update(crowdUser._id, {
				$set: updateUser
			});
		}

		return {
			userId: crowdUser._id
		};
	}
};

Accounts.registerLoginHandler('crowd', function(loginRequest) {
	if (!loginRequest.crowd) {
		return undefined;
	}

	logger.info('Init CROWD login', loginRequest.username);

	if (RocketChat.settings.get('CROWD_Enable') !== true) {
		return fallbackDefaultAccountSystem(this, loginRequest.username, loginRequest.crowdPassword);
	}

	const crowd = new CROWD();
	let user;
	try {
		user = crowd.authenticate(loginRequest.username, loginRequest.crowdPassword);
	} catch (error) {
		logger.error('Crowd user not authenticated due to an error, falling back');
	}

	if (!user) {
		return fallbackDefaultAccountSystem(this, loginRequest.username, loginRequest.crowdPassword);
	}

	return CROWD.addNewUser(user);
});

Meteor.methods({
	crowd_test_connection() {
		const user = Meteor.user();
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'crowd_test_connection' });
		}

		if (!RocketChat.authz.hasRole(user._id, 'admin')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'crowd_test_connection' });
		}

		if (RocketChat.settings.get('CROWD_Enable') !== true) {
			throw new Meteor.Error('crowd_disabled');
		}

		const crowd = new CROWD();

		try {
			crowd.checkConnection();
		} catch (error) {
			logger.error('Invalid crowd connection details, check the url and application username/password and make sure this server is allowed to speak to crowd');
			throw new Meteor.Error('Invalid connection details', '', { method: 'crowd_test_connection' });
		}

		return {
			message: 'Connection success',
			params: []
		};
	}
});

const jobName = 'Atlassian Crowd Sync';

const addCronJob = _.debounce(Meteor.bindEnvironment(function addCronJobDebounced() {
	if (RocketChat.settings.get('CROWD_Sync_User_Data') !== true) {
		logger.info('Disabling Crowd Background Sync');
		if (SyncedCron.nextScheduledAtDate(jobName)) {
			SyncedCron.remove(jobName);
		}
		return;
	}

	if (RocketChat.settings.get('CROWD_Sync_Interval')) {
		logger.info('Enabling Crowd Background Sync');
		SyncedCron.add({
			name: jobName,
			schedule: (parser) => parser.text(RocketChat.settings.get('CROWD_Sync_Interval')),
			job() {
				const crowd = new CROWD();
				crowd.sync();
			}
		});
		SyncedCron.start();
	}
}), 500);

Meteor.startup(() => {
	Meteor.defer(() => {
		RocketChat.settings.get('CROWD_Sync_User_Data', addCronJob);
		RocketChat.settings.get('CROWD_Sync_Interval', addCronJob);
	});
});
