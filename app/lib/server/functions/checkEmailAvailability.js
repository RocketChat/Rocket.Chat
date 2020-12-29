import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { escapeRegExp } from '../../../../lib/escapeRegExp';

export const checkEmailAvailability = function(email) {
	return !Meteor.users.findOne({ 'emails.address': { $regex: new RegExp(`^${ s.trim(escapeRegExp(email)) }$`, 'i') } });
};
