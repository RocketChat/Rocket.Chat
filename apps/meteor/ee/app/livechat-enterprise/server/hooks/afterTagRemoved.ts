import { CannedResponse } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'livechat.afterTagRemoved',
	async (tag) => {
		const { name } = tag;

		await CannedResponse.removeTagFromCannedResponses(name);
	},
	callbacks.priority.MEDIUM,
	'on-tag-removed-remove-references',
);
