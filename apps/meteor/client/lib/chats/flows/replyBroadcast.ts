import type { IMessage } from '@rocket.chat/core-typings';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { roomCoordinator } from '../../rooms/roomCoordinator';
import type { ChatAPI } from '../ChatAPI';

export const replyBroadcast = async (_chat: ChatAPI, message: IMessage) => {
	const queryStringParams = FlowRouter.current().queryParams;

	roomCoordinator.openRouteLink(
		'd',
		{ name: message.u.username },
		{
			...queryStringParams,
			reply: message._id,
		},
	);
};
