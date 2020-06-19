import { Meteor } from 'meteor/meteor';

import { userCanAccessAvatar } from '../utils';

// protect all avatar endpoints
export const protectAvatars = Meteor.bindEnvironment((req, res, next) => {
	if (!userCanAccessAvatar(req)) {
		res.writeHead(403);
		res.write('Forbidden');
		res.end();
		return;
	}

	return next();
});
