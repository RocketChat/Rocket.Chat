import { check } from 'meteor/check';
import { fetch } from 'meteor/fetch';
import { Gravatar } from 'meteor/jparker:gravatar';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { settings } from '../../../settings';

const avatarProviders = {
	facebook(user) {
		if (user.services && user.services.facebook && user.services.facebook.id && settings.get('Accounts_OAuth_Facebook')) {
			return {
				service: 'facebook',
				url: `https://graph.facebook.com/${user.services.facebook.id}/picture?type=large`,
			};
		}
	},

	google(user) {
		if (
			user.services &&
			user.services.google &&
			user.services.google.picture &&
			user.services.google.picture !== 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg' &&
			settings.get('Accounts_OAuth_Google')
		) {
			return {
				service: 'google',
				url: user.services.google.picture,
			};
		}
	},

	github(user) {
		if (user.services && user.services.github && user.services.github.username && settings.get('Accounts_OAuth_Github')) {
			return {
				service: 'github',
				url: `https://avatars.githubusercontent.com/${user.services.github.username}?s=200`,
			};
		}
	},

	linkedin(user) {
		if (
			user.services &&
			user.services.linkedin &&
			user.services.linkedin.profilePicture &&
			user.services.linkedin.profilePicture.identifiersUrl &&
			user.services.linkedin.profilePicture.identifiersUrl.length > 0 &&
			settings.get('Accounts_OAuth_Linkedin')
		) {
			const total = user.services.linkedin.profilePicture.identifiersUrl.length;
			return {
				service: 'linkedin',
				url: user.services.linkedin.profilePicture.identifiersUrl[total - 1],
			};
		}
	},

	twitter(user) {
		if (user.services && user.services.twitter && user.services.twitter.profile_image_url_https && settings.get('Accounts_OAuth_Twitter')) {
			return {
				service: 'twitter',
				url: user.services.twitter.profile_image_url_https.replace(/_normal|_bigger/, ''),
			};
		}
	},

	gitlab(user) {
		if (user.services && user.services.gitlab && user.services.gitlab.avatar_url && settings.get('Accounts_OAuth_Gitlab')) {
			return {
				service: 'gitlab',
				url: user.services.gitlab.avatar_url,
			};
		}
	},

	blockstack(user) {
		if (user.services && user.services.blockstack && user.services.blockstack.image && settings.get('Blockstack_Enable')) {
			return {
				service: 'blockstack',
				url: user.services.blockstack.image,
			};
		}
	},

	customOAuth(user) {
		const avatars = [];
		for (const service in user.services) {
			if (user.services[service]._OAuthCustom) {
				const services = ServiceConfiguration.configurations.find({ service }, { fields: { secret: 0 } }).fetch();

				if (services.length > 0) {
					if (user.services[service].avatarUrl) {
						avatars.push({
							service,
							url: user.services[service].avatarUrl,
						});
					}
				}
			}
		}
		return avatars;
	},

	emails(user) {
		const avatars = [];
		if (user.emails && user.emails.length > 0) {
			for (const email of user.emails) {
				if (email.verified === true) {
					avatars.push({
						service: 'gravatar',
						url: Gravatar.imageUrl(email.address, {
							default: '404',
							size: 200,
							secure: true,
						}),
					});
				}

				if (email.verified !== true) {
					avatars.push({
						service: 'gravatar',
						url: Gravatar.imageUrl(email.address, {
							default: '404',
							size: 200,
							secure: true,
						}),
					});
				}
			}
		}
		return avatars;
	},
};

export async function getAvatarSuggestionForUser(user) {
	check(user, Object);

	const avatars = [];

	for (const avatarProvider of Object.values(avatarProviders)) {
		const avatar = avatarProvider(user);
		if (avatar) {
			if (Array.isArray(avatar)) {
				avatars.push(...avatar);
			} else {
				avatars.push(avatar);
			}
		}
	}

	const validAvatars = {};
	for await (const avatar of avatars) {
		try {
			const response = await fetch(avatar.url);

			if (response.status === 200) {
				let blob = `data:${response.headers.get('content-type')};base64,`;
				blob += Buffer.from(await response.arrayBuffer()).toString('base64');
				avatar.blob = blob;
				avatar.contentType = response.headers.get('content-type');
				validAvatars[avatar.service] = avatar;
			}
		} catch (error) {
			// error;
		}
	}
	return validAvatars;
}
