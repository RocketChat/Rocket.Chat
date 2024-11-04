import type { ILivechatContactVisitorAssociation } from '@rocket.chat/core-typings';

export function isSameChannel(channel1: ILivechatContactVisitorAssociation, channel2: ILivechatContactVisitorAssociation): boolean {
	if (!channel1 || !channel2) {
		return false;
	}

	if (channel1.visitorId !== channel2.visitorId) {
		return false;
	}
	if (channel1.source.type !== channel2.source.type) {
		return false;
	}

	if ((channel1.source.id || channel2.source.id) && channel1.source.id !== channel2.source.id) {
		return false;
	}

	return true;
}
