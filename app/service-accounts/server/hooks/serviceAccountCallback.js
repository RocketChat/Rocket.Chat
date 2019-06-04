import { Accounts } from 'meteor/accounts-base';
import _ from 'underscore';

import { callbacks } from '../../../callbacks/server';
import { Users, Rooms } from '../../../models/server';
import { createRoom } from '../../../lib/server/functions';

callbacks.add('afterCreateUser', (user) => {
	if (!user || !user.u) {
		return user;
	}

	const stampedToken = Accounts._generateStampedLoginToken();

	Users.update(user._id, {
		$push: {
			'services.resume.loginTokens': Accounts._hashStampedToken(stampedToken),
		},
	});

	const extraData = {
		sa: true
	};

	if (!Rooms.findOneByName(`broadcast_${ user.username }`)) {
		createRoom('p', `broadcast_${ user.username }`, user.username, [], false, extraData, {});
	}

	return user;
});

callbacks.add('afterCreateUser', (user) => {
	if (!user || !user.u) {
		return user;
	}

	const stampedToken = Accounts._generateStampedLoginToken();

	Users.update(user._id, {
		$push: {
			'services.resume.loginTokens': Accounts._hashStampedToken(stampedToken),
		},
	});

	return user;
});
