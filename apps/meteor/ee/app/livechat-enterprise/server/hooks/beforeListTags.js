import { LivechatTag } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'livechat.beforeListTags',
	() => Promise.await(LivechatTag.find({}, { projection: { name: 1, departments: 1 } }).toArray()),
	callbacks.priority.LOW,
	'livechat-before-list-tags',
);
