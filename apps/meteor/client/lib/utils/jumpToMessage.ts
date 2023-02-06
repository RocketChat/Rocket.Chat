import type { IMessage } from '@rocket.chat/core-typings';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { ChatRoom } from '../../../app/models/client';
import { RoomHistoryManager } from '../../../app/ui-utils/client';

export const jumpToMessage = (message: IMessage) => {
	if (matchMedia('(max-width: 500px)').matches) {
		(Template.instance() as any).tabBar.close();
	}

	if (message.tmid) {
		return FlowRouter.go(
			FlowRouter.getRouteName(),
			{
				tab: 'thread',
				context: message.tmid,
				rid: message.rid,
				jump: message._id,
				name: ChatRoom.findOne({ _id: message.rid })?.name ?? '',
			},
			{
				jump: message._id,
			},
		);
	}
	return RoomHistoryManager.getSurroundingMessages(message);
};
