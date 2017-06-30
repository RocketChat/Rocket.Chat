/* globals:CROWD:true */
/* eslint new-cap: [2, {"capIsNewExceptions": ["SHA256"]}] */
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
		const AtlassianCrowd = Npm.require('atlassian-crowd');

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

		const user = {
			displayname: userResponse['display-name'],
			username: userResponse.name,
			email: userResponse.email,
			password,
			active: userResponse.active
		};

		return user;
	}

	syncDataToUser(crowdUser, id) {
		const user = {
			username: crowdUser.username,
			emails: [{
				address : crowdUser.email,
				verified: true
			}],
			password: crowdUser.password,
			active: crowdUser.active
		};

		if (crowdUser.displayname) {
			RocketChat._setRealName(id, crowdUser.displayname);
		}

		Meteor.users.update(id, {
			$set: user
		});
	}

	sync() {
		if (RocketChat.settings.get('CROWD_Enable') !== true) {
			return;
		}

		const self = this;
		logger.info('Sync started');

		const users = RocketChat.models.Users.findCrowdUsers();
		if (users) {
			users.forEach(function(user) {
				logger.info('Syncing user', user.username);
				const userResponse = self.crowdClient.user.findSync(user.username);
				if (userResponse) {
					const crowdUser = {
						displayname: userResponse['display-name'],
						username: userResponse.name,
						email: userResponse.email,
						password: userResponse.password,
						active: userResponse.active
					};

					self.syncDataToUser(crowdUser, user._id);
				}
			});
		}
	}

	addNewUser(crowdUser) {
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

			this.syncDataToUser(crowdUser, user._id);

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

	return crowd.addNewUser(user);
});

let interval;
let timeout;

RocketChat.settings.get('CROWD_Sync_User_Data', function(key, value) {
	Meteor.clearInterval(interval);
	Meteor.clearTimeout(timeout);

	if (value === true) {
		const crowd = new CROWD();
		logger.info('Enabling CROWD user sync');
		Meteor.setInterval(crowd.sync, 1000 * 60 * 60);
		Meteor.setTimeout(function() {
			crowd.sync();
		}, 1000 * 30);
	} else {
		logger.info('Disabling CROWD user sync');
	}
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
