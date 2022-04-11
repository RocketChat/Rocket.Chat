import { callbacks } from '../../../../../lib/callbacks';
import LivechatTag from '../../../models/server/models/LivechatTag';

callbacks.add(
	'livechat.beforeListTags',
	() => LivechatTag.find({}, { fields: { name: 1, departments: 1 } }).fetch(),
	callbacks.priority.LOW,
	'livechat-before-list-tags',
);
