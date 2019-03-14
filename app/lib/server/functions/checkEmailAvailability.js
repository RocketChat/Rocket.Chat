import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

export const checkEmailAvailability = function(email) {
	return !Meteor.users.findOne({ 'emails.address': { $regex : new RegExp(`^${ s.trim(s.escapeRegExp(email)) }$`, 'i') } });
};
