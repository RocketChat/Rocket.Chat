import { IRoomClosingInfo, IOmniRoomClosingMessage } from '@rocket.chat/core-typings';

import { OmnichannelVoipService } from '../../../../../server/services/omnichannel-voip/service';
import { overwriteClassOnLicense } from '../../../license/server';

overwriteClassOnLicense('livechat-enterprise', OmnichannelVoipService, {
	getRoomClosingData(
		_originalFn: any,
		closeInfo: IRoomClosingInfo,
		closeSystemMsgData: IOmniRoomClosingMessage,
		sysMessageId: 'voip-call-wrapup' | 'voip-call-ended-unexpectedly',
		options: { comment?: string; tags?: string[] },
	): { closeInfo: IRoomClosingInfo; closeSystemMsgData: IOmniRoomClosingMessage } {
		const { comment, tags } = options;
		if (comment) {
			closeSystemMsgData.msg = comment;
		}
		if (tags?.length) {
			closeInfo.tags = tags;
		}

		if (sysMessageId === 'voip-call-wrapup' && !comment) {
			closeSystemMsgData.t = 'voip-call-ended';
		}

		return { closeInfo, closeSystemMsgData };
	},
});
