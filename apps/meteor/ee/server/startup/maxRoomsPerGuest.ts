import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { callbacks } from '../../../lib/callbacks';
import { getMaxRoomsPerGuest } from '../../app/license/server/license';
import { Subscriptions } from '../../../app/models/server';

callbacks.add(
	'beforeAddedToRoom',
	({ user }) => {
		if (user.roles.includes('guest')) {
			const totalSubscriptions = Subscriptions.findByUserId(user._id).count();

			if (totalSubscriptions >= getMaxRoomsPerGuest()) {
				throw new Meteor.Error('error-max-rooms-per-guest-reached', TAPi18n.__('error-max-rooms-per-guest-reached'));
			}
		}
	},
	callbacks.priority.MEDIUM,
	'check-max-rooms-per-guest',
);
