/* globals:CROWD:true */
/* eslint new-cap: [2, {"capIsNewExceptions": ["SHA256"]}] */
const logger = new Logger('CROWD', {});

function fallbackDefaultAccountSystem(bind, username, password) {
	if (typeof username === 'string') {
		if (username.indexOf('@') === -1) {
			username = {username: username};
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
		const self = this;

		self.options = {
			crowd: {
				base: RocketChat.settings.get('CROWD_URL')
			},
			application: {
				name: RocketChat.settings.get('CROWD_APP_USERNAME'),
				password: RocketChat.settings.get('CROWD_APP_PASSWORD')
			}
		};

		self.crowdClient = new AtlassianCrowd(self.options);

		self.crowdClient.user.authenticateSync = Meteor.wrapAsync(self.crowdClient.user.authenticate, self);
		self.crowdClient.user.findSync = Meteor.wrapAsync(self.crowdClient.user.find, self);
	}

	authenticate(username, password) {
		const self = this;

		if (!username || !password) {
			logger.error('No username or password');
			return;
		}

		try {
			logger.info('Going to crowd:', username);
			const auth = self.crowdClient.user.authenticateSync(username, password);

			if (!auth) {
				return;
			}

			const userResponse = self.crowdClient.user.findSync(username);

			const user = {
				displayname: userResponse['display-name'],
				username: userResponse.name,
				email: userResponse.email,
				password: password,
				active: userResponse.active
			};

			return user;
		} catch (error) {
			logger.info('Crowd had an issue or the user didnt authenticate');
		}
	}

	syncDataToUser(crowdUser, id) {
		const user = {
			name: crowdUser.displayname,
			username: crowdUser.username,
			emails: [{
				address : crowdUser.email,
				verified: true
			}],
			password: crowdUser.password,
			active: crowdUser.active
		};

		Meteor.users.update(id, {
			$set: user
		});
	}

	sync() {
		if (RocketChat.settings.get('CROWD_Enable') !== true) {
			return;
		}

		var self = this;
		logger.info('Sync started');

		const users = RocketChat.models.Users.findCrowdUsers();
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

	addNewUser(crowdUser) {
		var self = this;

		var userQuery = {
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

			self.syncDataToUser(crowdUser, user._id);

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

		Meteor.runAsUser(crowdUser._id, function() {
			Meteor.call('joinDefaultChannels');
		});

		return {
			userId: crowdUser._id
		};
	}
};

Accounts.registerLoginHandler('crowd', function(loginRequest) {
	const crowd = new CROWD();
	let user = crowd.authenticate(loginRequest.username, loginRequest.crowdPassword);

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
