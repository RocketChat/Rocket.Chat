import { callbacks } from '../../../../../lib/callbacks';
import { getLivechatQueueInfo, getLivechatCustomFields } from '../lib/Helper';

const onLoadConfigApi = async (options = {}) => {
	const { room } = options;

	const queueInfo = await getLivechatQueueInfo(room);
	const customFields = await getLivechatCustomFields();

	return {
		...(queueInfo && { queueInfo }),
		...(customFields && { customFields }),
		...options,
	};
};

callbacks.add(
	'livechat.onLoadConfigApi',
	// TODO callbacks cannot be async
	(options) => Promise.await(onLoadConfigApi(options)),
	callbacks.priority.MEDIUM,
	'livechat-on-load-config-api',
);
