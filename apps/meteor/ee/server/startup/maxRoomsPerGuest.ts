import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Subscriptions } from '@rocket.chat/models';

import { callbacks } from '../../../lib/callbacks';
import { getMaxRoomsPerGuest } from '../../app/license/server/license';

callbacks.add(
	'beforeAddedToRoom',
	async ({ user }) => {
		if (user.roles.includes('guest')) {
			const totalSubscriptions = await Subscriptions.countByUserId(user._id);

			if (totalSubscriptions >= getMaxRoomsPerGuest()) {
				throw new Meteor.Error('error-max-rooms-per-guest-reached', TAPi18n.__('error-max-rooms-per-guest-reached'));
			}
		}
	},
	callbacks.priority.MEDIUM,
	'check-max-rooms-per-guest',
);
