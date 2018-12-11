import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

export const getAvatarUrlFromUsername = (username) => {
	const key = `avatar_random_${ username }`;
	const random = Session.keys[key] || 0;
	if (!username) {
		return;
	}

	return `${ Meteor.absoluteUrl() }avatar/${ username }.jpg?_dc=${ random }`;
};