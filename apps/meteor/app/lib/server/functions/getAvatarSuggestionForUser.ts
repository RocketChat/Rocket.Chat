import type { IUser } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import Gravatar from 'gravatar';
import { check } from 'meteor/check';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { settings } from '../../../settings/server';

const avatarProviders = {
	facebook(user: IUser) {
		if (user.services?.facebook?.id && settings.get('Accounts_OAuth_Facebook')) {
			return {
				service: 'facebook',
				url: `https://graph.facebook.com/${user.services.facebook.id}/picture?type=large`,
			};
		}
	},

	google(user: IUser) {
		if (
			user.services?.google?.picture &&
			user.services.google.picture !== 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg' &&
			settings.get('Accounts_OAuth_Google')
		) {
			return {
				service: 'google',
				url: user.services.google.picture,
			};
		}
	},

	github(user: IUser) {
		if (user.services?.github?.username && settings.get('Accounts_OAuth_Github')) {
			return {
				service: 'github',
				url: `https://avatars.githubusercontent.com/${user.services.github.username}?s=200`,
			};
		}
	},

	linkedin(user: IUser) {
		if (
			user.services?.linkedin?.profilePicture?.identifiersUrl &&
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

	twitter(user: IUser) {
		if (user.services?.twitter?.profile_image_url_https && settings.get('Accounts_OAuth_Twitter')) {
			return {
				service: 'twitter',
				url: user.services.twitter.profile_image_url_https.replace(/_normal|_bigger/, ''),
			};
		}
	},

	gitlab(user: IUser) {
		if (user.services?.gitlab?.avatar_url && settings.get('Accounts_OAuth_Gitlab')) {
			return {
				service: 'gitlab',
				url: user.services.gitlab.avatar_url,
			};
		}
	},

	async customOAuth(user: IUser) {
		const avatars: { service: string; url: string }[] = [];
		if (!user.services) {
			return avatars;
		}

		await Promise.all(
			Object.keys(user.services).map(async (service) => {
				if (!user.services) {
					return;
				}

				if (user.services[service as keyof typeof user.services]._OAuthCustom) {
					const services = await ServiceConfiguration.configurations.find({ service }, { fields: { secret: 0 } }).fetchAsync();

					if (services.length > 0) {
						if (user.services[service as keyof typeof user.services].avatarUrl) {
							avatars.push({
								service,
								url: user.services[service as keyof typeof user.services].avatarUrl,
							});
						}
					}
				}
			}),
		);

		return avatars;
	},

	emails(user: IUser) {
		const avatars = [];
		if (user.emails && user.emails.length > 0) {
			for (const email of user.emails) {
				if (email.verified === true) {
					avatars.push({
						service: 'gravatar',
						url: Gravatar.url(email.address, {
							default: '404',
							size: '200',
							protocol: 'https',
						}),
					});
				}

				if (email.verified !== true) {
					avatars.push({
						service: 'gravatar',
						url: Gravatar.url(email.address, {
							default: '404',
							size: '200',
							protocol: 'https',
						}),
					});
				}
			}
		}
		return avatars;
	},
};

/**
 * @return {Object}
 */
export async function getAvatarSuggestionForUser(
	user: IUser,
): Promise<Record<string, { blob: string; contentType: string; service: string; url: string }>> {
	check(user, Object);

	const avatars = [];

	for await (const avatarProvider of Object.values(avatarProviders)) {
		const avatar = await avatarProvider(user);
		if (avatar) {
			if (Array.isArray(avatar)) {
				avatars.push(...avatar);
			} else {
				avatars.push(avatar);
			}
		}
	}

	const validAvatars: Record<string, { blob: string; contentType: string; service: string; url: string }> = {};
	for await (const avatar of avatars) {
		try {
			const response = await fetch(avatar.url);
			const newAvatar: { service: string; url: string; blob: string; contentType: string } = {
				service: avatar.service,
				url: avatar.url,
				blob: '',
				contentType: '',
			};

			if (response.status === 200) {
				let blob = `data:${response.headers.get('content-type')};base64,`;
				blob += Buffer.from(await response.arrayBuffer()).toString('base64');
				newAvatar.blob = blob;
				newAvatar.contentType = response.headers.get('content-type')!;
				validAvatars[avatar.service] = newAvatar;
			}
		} catch (error) {
			// error;
		}
	}
	return validAvatars;
}
