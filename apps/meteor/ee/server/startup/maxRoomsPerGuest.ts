import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../lib/callbacks';
import { i18n } from '../../../server/lib/i18n';
import { canAddNewGuestSubscription } from '../../app/license/server/license';

callbacks.add(
	'beforeAddedToRoom',
	async ({ user }) => {
		if (user.roles?.includes('guest')) {
			if (!(await canAddNewGuestSubscription(user._id))) {
				throw new Meteor.Error('error-max-rooms-per-guest-reached', i18n.t('error-max-rooms-per-guest-reached'));
			}
		}
	},
	callbacks.priority.MEDIUM,
	'check-max-rooms-per-guest',
);
