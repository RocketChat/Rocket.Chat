/* global Gravatar */

function getAvatarSuggestionForUser(user) {
	check(user, Object);

	const avatars = [];

	const ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;

	for (const service in user.services) {
		if (service === 'facebook' && user.services.facebook.id && RocketChat.settings.get('Accounts_OAuth_Facebook')) {
			avatars.push({
				service: 'facebook',
				url: `https://graph.facebook.com/${ user.services.facebook.id }/picture?type=large`
			});
		}

		if (service === 'google' && user.services.google.picture && user.services.google.picture !== 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg' && RocketChat.settings.get('Accounts_OAuth_Google')) {
			avatars.push({
				service: 'google',
				url: user.services.google.picture
			});
		}

		if (service === 'github' && user.services.github.username && RocketChat.settings.get('Accounts_OAuth_Github')) {
			avatars.push({
				service: 'github',
				url: `https://avatars.githubusercontent.com/${ user.services.github.username }?s=200`
			});
		}

		if (service === 'linkedin' && user.services.linkedin.pictureUrl && RocketChat.settings.get('Accounts_OAuth_Linkedin')) {
			avatars.push({
				service: 'linkedin',
				url: user.services.linkedin.pictureUrl
			});
		}

		if (service === 'twitter' && user.services.twitter.profile_image_url_https && RocketChat.settings.get('Accounts_OAuth_Twitter')) {
			avatars.push({
				service: 'twitter',
				url: user.services.twitter.profile_image_url_https.replace(/_normal|_bigger/, '')
			});
		}

		if (service === 'gitlab' && user.services.gitlab.avatar_url && RocketChat.settings.get('Accounts_OAuth_Gitlab')) {
			avatars.push({
				service: 'gitlab',
				url: user.services.gitlab.avatar_url
			});
		}

		if (service === 'sandstorm' && user.services.sandstorm.picture && Meteor.settings['public'].sandstorm) {
			avatars.push({
				service: 'sandstorm',
				url: user.services.sandstorm.picture
			});
		}

		if (user.services[service]._OAuthCustom) {
			const services = ServiceConfiguration.configurations.find({service}, {fields: {secret: 0}}).fetch();

			if (services.length > 0) {
				if (services[0].avatarField) {
					const avatarUrl = services[0].avatarField.split('.').reduce(function(prev, curr) {
						return prev ? prev[curr] : undefined;
					}, user.services[service]);

					avatars.push({
						service,
						url: avatarUrl
					});
				}
			}
		}
	}

	if (user.emails && user.emails.length > 0) {
		for (const email of user.emails) {
			if (email.verified === true) {
				avatars.push({
					service: 'gravatar',
					url: Gravatar.imageUrl(email.address, {
						'default': '404',
						size: 200,
						secure: true
					})
				});
			}

			if (email.verified !== true) {
				avatars.push({
					service: 'gravatar',
					url: Gravatar.imageUrl(email.address, {
						'default': '404',
						size: 200,
						secure: true
					})
				});
			}
		}
	}

	const validAvatars = {};
	for (const avatar of avatars) {
		try {
			const result = HTTP.get(avatar.url, {
				npmRequestOptions: {
					encoding: 'binary'
				}
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

this.getAvatarSuggestionForUser = getAvatarSuggestionForUser;

Meteor.methods({
	getAvatarSuggestion() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getAvatarSuggestion'
			});
		}

		this.unblock();

		const user = Meteor.user();

		return getAvatarSuggestionForUser(user);
	}
});
