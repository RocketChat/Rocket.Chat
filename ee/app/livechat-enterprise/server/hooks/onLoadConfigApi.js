import { callbacks } from '../../../../../app/callbacks';
import { getLivechatQueueInfo, getLivechatCustomFields } from '../lib/Helper';

callbacks.add('livechat.onLoadConfigApi', async (options = {}) => {
	const { room } = options;

	const queueInfo = await getLivechatQueueInfo(room);
	const customFields = getLivechatCustomFields();

	const config = {
		...queueInfo && { queueInfo },
		...customFields && { customFields },
	};

	return Object.assign({ config }, options);
}, callbacks.priority.MEDIUM, 'livechat-on-load-config-api');
