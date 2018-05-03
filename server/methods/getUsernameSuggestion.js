/* global slugify */
import _ from 'underscore';

function slug(text) {
	text = slugify(text, '.');
	return text.replace(/[^0-9a-z-_.]/g, '');
}

function usernameIsAvaliable(username) {
	if (username.length < 1) {
		return false;
	}

	if (username === 'all') {
		return false;
	}

	return !RocketChat.models.Users.findOneByUsername(username);
}

function generateSuggestion(user) {
	let usernames = [];
	let username = undefined;

	if (Meteor.settings['public'].sandstorm) {
		usernames.push(user.services.sandstorm.preferredHandle);
	}

	if (Match.test(user && user.name, String)) {
		if (RocketChat.settings.get('UTF8_Names_Slugify')) {
			usernames.push(slug(user.name));
		} else {
			usernames.push(user.name);
		}

		const nameParts = user.name.split(' ');

		if (nameParts.length > 1) {
			const first = nameParts[0];
			const last = nameParts[nameParts.length - 1];

			if (RocketChat.settings.get('UTF8_Names_Slugify')) {
				usernames.push(slug(first[0] + last));
				usernames.push(slug(first + last[0]));
			} else {
				usernames.push(first[0] + last);
				usernames.push(first + last[0]);
			}
		}
	}

	if (user.profile && user.profile.name) {
		if (RocketChat.settings.get('UTF8_Names_Slugify')) {
			usernames.push(slug(user.profile.name));
		} else {
			usernames.push(user.profile.name);
		}
	}

	if (Array.isArray(user.services)) {
		let services = user.services.map((service) => {
			return _.values(_.pick(service, 'name', 'username', 'firstName', 'lastName'));
		});

		services = _.uniq(_.flatten(services));

		for (const service of services) {
			if (RocketChat.settings.get('UTF8_Names_Slugify')) {
				usernames.push(slug(service));
			} else {
				usernames.push(service);
			}
		}
	}

	if (user.emails && user.emails.length > 0) {
		for (const email of user.emails) {
			if (email.address && email.verified === true) {
				usernames.push(slug(email.address.replace(/@.+$/, '')));
				usernames.push(slug(email.address.replace(/(.+)@(\w+).+/, '$1.$2')));
			}
		}
	}

	usernames = _.compact(usernames);

	for (const item of usernames) {
		if (usernameIsAvaliable(item)) {
			return item;
		}
	}

	if (usernames.length === 0 || usernames[0].length === 0) {
		usernames.push(RocketChat.settings.get('Accounts_DefaultUsernamePrefixSuggestion'));
	}

	let index = 0;
	while (!username) {
		index++;
		if (usernameIsAvaliable(`${ usernames[0] }-${ index }`)) {
			username = `${ usernames[0] }-${ index }`;
		}
	}

	if (usernameIsAvaliable(username)) {
		return username;
	}
}

RocketChat.generateUsernameSuggestion = generateSuggestion;

Meteor.methods({
	getUsernameSuggestion() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getUsernameSuggestion'
			});
		}

		const user = Meteor.user();

		return generateSuggestion(user);
	}
});
