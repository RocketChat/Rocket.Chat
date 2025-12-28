import type { ILivechatContactChannel, ILivechatVisitor, IOmnichannelSource } from '@rocket.chat/core-typings';

export const isVerifiedChannelInSource = (
	channel: ILivechatContactChannel,
	visitorId: ILivechatVisitor['_id'],
	source: IOmnichannelSource,
) => {
	if (!channel.verified) {
		return false;
	}

	if (channel.visitor.visitorId !== visitorId) {
		return false;
	}

	if (channel.visitor.source.type !== source.type) {
		return false;
	}

	if ((source.id || channel.visitor.source.id) && channel.visitor.source.id !== source.id) {
		return false;
	}

	return true;
};
