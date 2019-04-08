import { check } from 'meteor/check';
import { HTTP } from 'meteor/http';
import { Gravatar } from 'meteor/jparker:gravatar';
import { settings } from '../../../settings';

export function getAvatarSuggestionForUser(user) {
	check(user, Object);

	const avatars = [];

	if (user.services.facebook && user.services.facebook.id && settings.get('Accounts_OAuth_Facebook')) {
		avatars.push({
			service: 'facebook',
			url: `https://graph.facebook.com/${ user.services.facebook.id }/picture?type=large`,
		});
	}

	if (user.services.google && user.services.google.picture && user.services.google.picture !== 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg' && settings.get('Accounts_OAuth_Google')) {
		avatars.push({
			service: 'google',
			url: user.services.google.picture,
		});
	}

	if (user.services.github && user.services.github.username && settings.get('Accounts_OAuth_Github')) {
		avatars.push({
			service: 'github',
			url: `https://avatars.githubusercontent.com/${ user.services.github.username }?s=200`,
		});
	}

	if (user.services.linkedin && user.services.linkedin.pictureUrl && settings.get('Accounts_OAuth_Linkedin')) {
		avatars.push({
			service: 'linkedin',
			url: user.services.linkedin.pictureUrl,
		});
	}

	if (user.services.twitter && user.services.twitter.profile_image_url_https && settings.get('Accounts_OAuth_Twitter')) {
		avatars.push({
			service: 'twitter',
			url: user.services.twitter.profile_image_url_https.replace(/_normal|_bigger/, ''),
		});
	}

	if (user.services.gitlab && user.services.gitlab.avatar_url && settings.get('Accounts_OAuth_Gitlab')) {
		avatars.push({
			service: 'gitlab',
			url: user.services.gitlab.avatar_url,
		});
	}

	if (user.services.blockstack && user.services.blockstack.image && settings.get('Blockstack_Enable')) {
		avatars.push({
			service: 'blockstack',
			url: user.services.blockstack.image,
		});
	}

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

	const validAvatars = {};
	for (const avatar of avatars) {
		try {
			const result = HTTP.get(avatar.url, {
				npmRequestOptions: {
					encoding: 'binary',
				},
			});

			if (result.statusCode === 200) {
				let blob = `data:${ result.headers['content-type'] };base64,`;
				blob += Buffer.from(result.content, 'binary').toString('base64');
				avatar.blob = blob;
				avatar.contentType = result.headers['content-type'];
				validAvatars[avatar.service] = avatar;
			}
		} catch (error) {
			// error;
		}
	}
	return validAvatars;
}
