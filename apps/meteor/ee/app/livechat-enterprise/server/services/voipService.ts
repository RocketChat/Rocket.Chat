import { ILivechatVisitor, ILivechatAgent, IVoipRoom, IRoomClosingInfo } from '@rocket.chat/core-typings';

import { OmnichannelVoipService } from '../../../../../server/services/omnichannel-voip/service';
import { overwriteClassOnLicense } from '../../../license/server';

const { getBaseRoomClosingData } = OmnichannelVoipService.prototype;

overwriteClassOnLicense('livechat-enterprise', OmnichannelVoipService, {
	async getRoomClosingData(
		closerParam: ILivechatVisitor | ILivechatAgent,
		room: IVoipRoom,
		options: { comment?: string; tags?: string[] },
		sysMessageId: 'voip-call-wrapup' | 'voip-call-ended-unexpectedly',
	): Promise<{ closeInfo: IRoomClosingInfo; closeSystemMsgData: any }> {
		console.log('Calling enterprise version');
		const { closeInfo, closeSystemMsgData } = await getBaseRoomClosingData(closerParam, room, options, sysMessageId);

		const { comment, tags } = options;
		if (comment) {
			closeSystemMsgData.comment = comment;
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
