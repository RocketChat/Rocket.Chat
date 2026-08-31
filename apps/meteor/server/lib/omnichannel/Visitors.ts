import type { ILivechatContactVisitorAssociation, IOmnichannelSource } from '@rocket.chat/core-typings';

export const Visitors = {
	makeVisitorAssociation(visitorId: string, roomInfo: IOmnichannelSource): ILivechatContactVisitorAssociation {
		return {
			visitorId,
			source: {
				type: roomInfo.type,
				id: roomInfo.id,
			},
		};
	},
};
