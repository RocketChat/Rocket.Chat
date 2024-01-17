import type { ILivechatAgent, ILivechatVisitor, IVoipRoomClosingInfo, IUser, IVoipRoom } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';

import type { IOmniRoomClosingMessage } from '../../../../../server/services/omnichannel-voip/internalTypes';
import { OmnichannelVoipService } from '../../../../../server/services/omnichannel-voip/service';
import { calculateOnHoldTimeForRoom } from '../lib/calculateOnHoldTimeForRoom';

await License.overwriteClassOnLicense('voip-enterprise', OmnichannelVoipService, {
	async getRoomClosingData(
		_originalFn: (
			closer: ILivechatVisitor | ILivechatAgent,
			room: IVoipRoom,
			user: IUser,
			sysMessageId?: 'voip-call-wrapup' | 'voip-call-ended-unexpectedly',
			options?: { comment?: string | null; tags?: string[] | null },
		) => Promise<boolean>,
		closeInfo: IVoipRoomClosingInfo,
		closeSystemMsgData: IOmniRoomClosingMessage,
		room: IVoipRoom,
		sysMessageId: 'voip-call-wrapup' | 'voip-call-ended-unexpectedly',
		options?: { comment?: string; tags?: string[] },
	): Promise<{ closeInfo: IVoipRoomClosingInfo; closeSystemMsgData: IOmniRoomClosingMessage }> {
		const { comment, tags } = options || {};
		if (comment) {
			closeSystemMsgData.msg = comment;
		}
		if (tags?.length) {
			closeInfo.tags = tags;
		}

		if (sysMessageId === 'voip-call-wrapup' && !comment) {
			closeSystemMsgData.t = 'voip-call-ended';
		}

		const now = new Date();
		const callTotalHoldTime = await calculateOnHoldTimeForRoom(room, now);
		closeInfo.callTotalHoldTime = callTotalHoldTime;

		return { closeInfo, closeSystemMsgData };
	},
});
