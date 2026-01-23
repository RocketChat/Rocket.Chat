import type { IOmnichannelRoom } from '@rocket.chat/core-typings';

import { getExtraConfigInfo } from '../../../../../app/livechat/server/api/lib/livechat';
import { getLivechatQueueInfo, getLivechatCustomFields } from '../lib/Helper';

getExtraConfigInfo.patch(
	async (
		_: any,
		options: {
			room?: IOmnichannelRoom;
		},
	): Promise<{
		queueInfo?: unknown;
		customFields?: {
			options?: string[] | undefined;
			_id: string;
			label: string;
			regexp: string | undefined;
			required: boolean;
			type: string | undefined;
			defaultValue: string | null;
		}[];
		room?: IOmnichannelRoom;
	}> => {
		const { room } = options;

		const [queueInfo, customFields] = await Promise.all([getLivechatQueueInfo(room), getLivechatCustomFields()]);
		return {
			...(queueInfo && { queueInfo }),
			...(customFields && { customFields }),
			...options,
		};
	},
);
