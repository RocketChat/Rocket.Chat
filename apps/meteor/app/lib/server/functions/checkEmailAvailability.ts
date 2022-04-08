import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import { escapeRegExp } from '@rocket.chat/string-helpers';

export const checkEmailAvailability = function (email: string): boolean {
	return !Meteor.users.findOne({
		'emails.address': { $regex: new RegExp(`^${s.trim(escapeRegExp(email))}$`, 'i') },
	});
};
