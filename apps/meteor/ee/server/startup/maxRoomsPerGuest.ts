import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../lib/callbacks';
import { i18n } from '../../../server/lib/i18n';

callbacks.add(
	'beforeAddedToRoom',
	async ({ user }) => {
		if (user.roles?.includes('guest')) {
			if (await License.shouldPreventAction('roomsPerGuest', 0, { userId: user._id })) {
				throw new Meteor.Error('error-max-rooms-per-guest-reached', i18n.t('error-max-rooms-per-guest-reached'));
			}
		}
	},
	callbacks.priority.MEDIUM,
	'check-max-rooms-per-guest',
);
