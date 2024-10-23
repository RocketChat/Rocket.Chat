import type { ILivechatVisitor, IOmnichannelSource, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';

export async function getVisitorNewestSource(visitor: ILivechatVisitor): Promise<IOmnichannelSource | null> {
	const room = await LivechatRooms.findNewestByVisitorIdOrToken<Pick<IOmnichannelRoom, '_id' | 'source'>>(visitor._id, visitor.token, {
		projection: { source: 1 },
	});

	if (!room) {
		return null;
	}

	return room.source;
}
