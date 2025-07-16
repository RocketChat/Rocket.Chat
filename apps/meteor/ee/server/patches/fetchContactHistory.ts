import { License } from '@rocket.chat/license';
import { LivechatRooms } from '@rocket.chat/models';

import { fetchContactHistory } from '../../../app/livechat/server/lib/contacts/getContactHistory';

fetchContactHistory.patch(
	async (next, params) => {
		const { contactId, options, extraParams } = params;

		if (!extraParams?.source || typeof extraParams.source !== 'string') {
			return next(params);
		}

		return LivechatRooms.findClosedRoomsByContactAndSourcePaginated({
			contactId,
			source: extraParams.source,
			options,
		});
	},
	() => License.hasModule('contact-id-verification'),
);
