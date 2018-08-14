import { AccountsServer } from 'meteor/rocketchat:accounts';
import { RocketChat } from 'meteor/rocketchat:lib';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { GrantError } from './error';
import Providers from './providers';

const setAvatarFromUrl = (userId, url) => {
	return new Promise((resolve, reject) => {
		Meteor.runAsUser(userId, () => {
			Meteor.call('setAvatarFromService', url, '', 'url', (err) => {
				if (err) {
					if (err.details.timeToReset && err.details.timeToReset) {
						reject((t('error-too-many-requests', {
							seconds: parseInt(err.details.timeToReset / 1000)
						})));
					} else {
						reject(t('Avatar_url_invalid_or_error'));
					}
				} else {
					resolve();
				}
			});
		});
	});
};

const findUserByOAuthId = (providerName, id) => {
	return RocketChat.models.Users.findOne({ [`settings.profile.oauth.${ providerName }`]: id });
};

const addOAuthIdToUserProfile = (user, providerName, providerId) => {
	const profile = Object.assign({}, user.settings.profile, {
		oauth: {
			...user.settings.profile.oauth,
			[providerName]: providerId
		}
	});

	RocketChat.models.Users.setProfile(user.id, profile);
};

function getAccessToken(req) {
	const i = req.url.indexOf('?');

	if (i === -1) {
		return;
	}

	const barePath = req.url.substring(i + 1);
	const splitPath = barePath.split('&');
	const token = splitPath.find(p => p.match(/access_token=[a-zA-Z0-9]+/));

	if (token) {
		return token.replace('access_token=', '');
	}
}

export async function authenticate(providerName, req) {
	let tokens;
	const accessToken = getAccessToken(req);
	const provider = Providers.get(providerName);

	if (!provider) {
		throw new GrantError(`Provider '${ providerName }' not found`);
	}

	const userData = provider.getUser(accessToken);

	let user = findUserByOAuthId(providerName, userData.id);

	if (user) {
		user.id = user._id;
	} else {
		user = RocketChat.models.Users.findOneByEmailAddress(userData.email);
		if (user) {
			user.id = user._id;
		}
	}

	if (user) {
		addOAuthIdToUserProfile(user, providerName, userData.id);

		const loginResult = await AccountsServer.loginWithUser({ id: user.id });

		tokens = loginResult.tokens;
	} else {
		const id = Accounts.createUser({
			email: userData.email,
			username: userData.username
		});

		RocketChat.models.Users.setProfile(id, {
			avatar: userData.avatar,
			oauth: {
				[providerName]: userData.id
			}
		});
		RocketChat.models.Users.setName(id, userData.name);
		RocketChat.models.Users.setEmailVerified(id, userData.email);

		await setAvatarFromUrl(id, userData.avatar);

		const loginResult = await AccountsServer.loginWithUser({ id });

		tokens = loginResult.tokens;
	}

	return tokens;
}
