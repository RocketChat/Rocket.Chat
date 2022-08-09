import type { ILivechatAgent, ILivechatVisitor, IRoomClosingInfo, IUser, IVoipRoom } from '@rocket.chat/core-typings';

import type { IOmniRoomClosingMessage } from '../../../../../server/services/omnichannel-voip/internalTypes';
import { OmnichannelVoipService } from '../../../../../server/services/omnichannel-voip/service';
import { overwriteClassOnLicense } from '../../../license/server';
import { calculateOnHoldTimeForRoom } from '../lib/calculateOnHoldTimeForRoom';

overwriteClassOnLicense('voip-enterprise', OmnichannelVoipService, {
	getRoomClosingData(
		_originalFn: (
			closer: ILivechatVisitor | ILivechatAgent,
			room: IVoipRoom,
			user: IUser,
			sysMessageId?: 'voip-call-wrapup' | 'voip-call-ended-unexpectedly',
			options?: { comment?: string | null; tags?: string[] | null },
		) => Promise<boolean>,
		closeInfo: IRoomClosingInfo,
		closeSystemMsgData: IOmniRoomClosingMessage,
		room: IVoipRoom,
		sysMessageId: 'voip-call-wrapup' | 'voip-call-ended-unexpectedly',
		options?: { comment?: string; tags?: string[] },
	): { closeInfo: IRoomClosingInfo; closeSystemMsgData: IOmniRoomClosingMessage } {
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
		const callTotalHoldTime = Promise.await(calculateOnHoldTimeForRoom(room, now));
		closeInfo.callTotalHoldTime = callTotalHoldTime;

		return { closeInfo, closeSystemMsgData };
	},
});
