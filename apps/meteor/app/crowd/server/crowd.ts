import type { IUser } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import { Users } from '@rocket.chat/models';
import { SHA256 } from '@rocket.chat/sha256';
import AtlassianCrowd from 'atlassian-crowd-patched';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { crowdIntervalValuesToCronMap } from '../../../server/settings/crowd';
import { deleteUser } from '../../lib/server/functions/deleteUser';
import { _setRealName } from '../../lib/server/functions/setRealName';
import { setUserActiveStatus } from '../../lib/server/functions/setUserActiveStatus';
import { settings } from '../../settings/server';
import { logger } from './logger';

type CrowdUser = Pick<IUser, '_id' | 'username'> & { crowd: Record<string, any>; crowd_username: string };

function fallbackDefaultAccountSystem(bind: typeof Accounts, username: string | Record<string, any>, password: string) {
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
	private crowdClient: any;

	private options: {
		crowd: {
			base: string;
		};
		application: {
			name: string;
			password: string;
		};
		rejectUnauthorized: boolean;
	};

	constructor() {
		let url = settings.get<string>('CROWD_URL');

		this.options = {
			crowd: {
				base: !/\/$/.test(url) ? (url += '/') : url,
			},
			application: {
				name: settings.get('CROWD_APP_USERNAME'),
				password: settings.get('CROWD_APP_PASSWORD'),
			},
			rejectUnauthorized: settings.get('CROWD_Reject_Unauthorized'),
		};

		this.crowdClient = new AtlassianCrowd(this.options);
	}

	async checkConnection() {
		await this.crowdClient.ping();
	}

	async fetchCrowdUser(crowdUsername: string) {
		const userResponse = await this.crowdClient.user.find(crowdUsername);

		return {
			displayname: userResponse['display-name'],
			username: userResponse.name,
			email: userResponse.email,
			active: userResponse.active,
			crowd_username: crowdUsername,
		};
	}

	async authenticate(username: string, password: string) {
		if (!username || !password) {
			logger.error('No username or password');
			return;
		}
		const projection = { username: 1, crowd_username: 1, crowd: 1 };
		logger.info('Extracting crowd_username');
		let user = null;
		let crowdUsername = username;

		if (username.indexOf('@') !== -1) {
			const email = username;

			user = await Users.findOne<CrowdUser>({ 'emails.address': email }, { projection });
			if (user) {
				crowdUsername = user.crowd_username;
			} else {
				logger.debug('Could not find a user by email', username);
			}
		}

		if (user == null) {
			user = await Users.findOne<CrowdUser>({ username }, { projection });
			if (user) {
				crowdUsername = user.crowd_username;
			} else {
				logger.debug('Could not find a user by username');
			}
		}

		if (user == null) {
			user = await Users.findOne<CrowdUser>({ crowd_username: username }, { projection });
			if (user) {
				crowdUsername = user.crowd_username;
			} else {
				logger.debug('Could not find a user with by crowd_username', username);
			}
		}

		if (user && !crowdUsername) {
			logger.debug('Local user found, redirecting to fallback login');
			return {
				crowd: false,
			};
		}

		if (!user && crowdUsername) {
			logger.debug('New user. User is not synced yet.');
		}
		logger.debug('Going to crowd:', crowdUsername);
		const auth = await this.crowdClient.user.authenticate(crowdUsername, password);

		if (!auth) {
			return;
		}

		const crowdUser: Record<string, any> = await this.fetchCrowdUser(crowdUsername);

		if (user && settings.get('CROWD_Allow_Custom_Username') === true) {
			crowdUser.username = user.username;
		}

		if (user) {
			crowdUser._id = user._id;
		}
		crowdUser.password = password;

		return crowdUser;
	}

	async syncDataToUser(crowdUser: Record<string, any>, id: string) {
		const user = {
			username: this.cleanUsername(crowdUser.username),
			crowd_username: crowdUser.crowd_username,
			emails: [
				{
					address: crowdUser.email,
					verified: settings.get<boolean>('Accounts_Verify_Email_For_External_Accounts'),
				},
			],
			crowd: true,
		};

		if (crowdUser.password) {
			await Accounts.setPasswordAsync(id, crowdUser.password, {
				logout: false,
			});

			await Users.unsetRequirePasswordChange(id);
		}

		if (crowdUser.displayname) {
			await _setRealName(id, crowdUser.displayname);
		}

		await Users.updateOne(
			{ _id: id },
			{
				$set: user,
			},
		);

		await setUserActiveStatus(id, crowdUser.active);
	}

	async sync() {
		// if crowd is disabled bail out
		if (settings.get('CROWD_Enable') !== true) {
			return;
		}

		const users =
			((await Users.findCrowdUsers().toArray()) as unknown as (IUser & { crowd: Record<string, any>; crowd_username: string })[]) || [];

		logger.info('Sync started...');

		for await (const user of users) {
			let crowdUsername = user.hasOwnProperty('crowd_username') ? user.crowd_username : user.username;
			logger.info('Syncing user', crowdUsername);
			if (!crowdUsername) {
				logger.warn('User has no crowd_username', user.username);
				continue;
			}

			let crowdUser = null;

			try {
				crowdUser = await this.fetchCrowdUser(crowdUsername);
			} catch (err) {
				logger.debug({ err });
				logger.error({ msg: 'Could not sync user with username', crowd_username: crowdUsername });

				const email = user.emails?.[0].address;
				logger.info('Attempting to find for user by email', email);

				const response = this.crowdClient.searchSync('user', `email=" ${email} "`);
				if (!response || response.users.length === 0) {
					logger.warn('Could not find user in CROWD with username or email:', crowdUsername, email);
					if (settings.get('CROWD_Remove_Orphaned_Users') === true) {
						logger.info('Removing user:', crowdUsername);
						setImmediate(async () => {
							await deleteUser(user._id);
							logger.info('User removed:', crowdUsername);
						});
					}
					return;
				}
				crowdUsername = response.users[0].name;
				logger.info('User found by email. Syncing user', crowdUsername);
				if (!crowdUsername) {
					logger.warn('User has no crowd_username', user.username);
					continue;
				}

				crowdUser = await this.fetchCrowdUser(crowdUsername);
			}

			if (settings.get('CROWD_Allow_Custom_Username') === true) {
				crowdUser.username = user.username;
			}

			await this.syncDataToUser(crowdUser, user._id);
		}
	}

	cleanUsername(username: string) {
		if (settings.get('CROWD_Clean_Usernames') === true) {
			return username.split('@')[0];
		}
		return username;
	}

	async updateUserCollection(crowdUser: Record<string, any>) {
		const userQuery = {
			_id: crowdUser._id,
		};

		// find our existing user if they exist
		const user = await Users.findOne(userQuery);

		if (user) {
			const stampedToken = Accounts._generateStampedLoginToken();

			await Users.updateOne(
				{ _id: user._id },
				{
					$push: {
						'services.resume.loginTokens': Accounts._hashStampedToken(stampedToken),
					},
				},
			);

			await this.syncDataToUser(crowdUser, user._id);

			return {
				userId: user._id,
				token: stampedToken.token,
			};
		}

		// Attempt to create the new user
		try {
			crowdUser._id = await Accounts.createUserAsync(crowdUser);

			// sync the user data
			await this.syncDataToUser(crowdUser, crowdUser._id);

			return {
				userId: crowdUser._id,
			};
		} catch (err) {
			logger.error({ msg: 'Error creating new crowd user.', err });
		}
	}
}

Accounts.registerLoginHandler('crowd', async function (this: typeof Accounts, loginRequest) {
	if (!loginRequest.crowd) {
		return undefined;
	}

	logger.info('Init CROWD login', loginRequest.username);

	if (settings.get('CROWD_Enable') !== true) {
		return fallbackDefaultAccountSystem(this, loginRequest.username, loginRequest.crowdPassword);
	}

	try {
		const crowd = new CROWD();
		const user = await crowd.authenticate(loginRequest.username, loginRequest.crowdPassword);

		if (user && user.crowd === false) {
			logger.debug(`User ${loginRequest.username} is not a valid crowd user, falling back`);
			return fallbackDefaultAccountSystem(this, loginRequest.username, loginRequest.crowdPassword);
		}

		if (!user) {
			logger.debug(`User ${loginRequest.username} is not allowd to access Rocket.Chat`);
			return new Meteor.Error('not-authorized', 'User is not authorized by crowd');
		}

		const result = await crowd.updateUserCollection(user);

		return result;
	} catch (err) {
		logger.debug({ err });
		logger.error('Crowd user not authenticated due to an error');
	}
});

const jobName = 'CROWD_Sync';

Meteor.startup(() => {
	settings.watchMultiple(['CROWD_Sync_User_Data', 'CROWD_Sync_Interval'], async function addCronJobDebounced([data, interval]) {
		if (data !== true) {
			logger.info('Disabling CROWD Background Sync');
			if (await cronJobs.has(jobName)) {
				await cronJobs.remove(jobName);
			}
			return;
		}
		const crowd = new CROWD();
		if (interval) {
			if (await cronJobs.has(jobName)) {
				await cronJobs.remove(jobName);
			}

			logger.info('Enabling CROWD Background Sync');
			const cronInterval = crowdIntervalValuesToCronMap[String(interval)];

			await cronJobs.add(jobName, cronInterval, () => crowd.sync());
		}
	});
});
