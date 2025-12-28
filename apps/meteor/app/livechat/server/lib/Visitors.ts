import type { ILivechatContactVisitorAssociation, ILivechatVisitor, IOmnichannelSource } from '@rocket.chat/core-typings';

export const Visitors = {
	makeVisitorAssociation(visitorId: ILivechatVisitor['_id'], roomInfo: IOmnichannelSource): ILivechatContactVisitorAssociation {
		return {
			visitorId,
			source: {
				type: roomInfo.type,
				id: roomInfo.id,
			},
		};
	},
};
