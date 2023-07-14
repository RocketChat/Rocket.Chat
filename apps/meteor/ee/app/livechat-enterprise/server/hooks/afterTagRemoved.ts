import { CannedResponse } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'livechat.afterTagRemoved',
	async (tag) => {
		const { _id } = tag;

		await CannedResponse.removeTagFromCannedResponses(_id);
	},
	callbacks.priority.MEDIUM,
	'on-tag-removed-remove-references',
);
