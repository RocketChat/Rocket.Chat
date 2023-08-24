import { Subscriptions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../lib/callbacks';
import { i18n } from '../../../server/lib/i18n';
import { getMaxRoomsPerGuest } from '../../app/license/server/license';

callbacks.add(
	'beforeAddedToRoom',
	async ({ user }) => {
		if (user.roles?.includes('guest')) {
			const totalSubscriptions = await Subscriptions.countByUserId(user._id);

			if (totalSubscriptions >= getMaxRoomsPerGuest()) {
				throw new Meteor.Error('error-max-rooms-per-guest-reached', i18n.t('error-max-rooms-per-guest-reached'));
			}
		}
	},
	callbacks.priority.MEDIUM,
	'check-max-rooms-per-guest',
);
