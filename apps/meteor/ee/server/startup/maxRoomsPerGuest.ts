import { ClientSafeError } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';

import { callbacks } from '../../../server/lib/callbacks';
import { i18n } from '../../../server/lib/i18n';

callbacks.add(
	'beforeAddedToRoom',
	async ({ user }) => {
		if (user.roles?.includes('guest')) {
			// extraCount = 1 checks if adding one more room would exceed the limit
			// (not if they've already exceeded it, since this runs before adding them to the room)
			if (await License.shouldPreventAction('roomsPerGuest', 1, { userId: user._id })) {
				throw new ClientSafeError('error-max-rooms-per-guest-reached', i18n.t('error-max-rooms-per-guest-reached'));
			}
		}
	},
	callbacks.priority.MEDIUM,
	'check-max-rooms-per-guest',
);
