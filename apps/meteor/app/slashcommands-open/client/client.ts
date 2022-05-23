import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import type { IMessage } from '@rocket.chat/core-typings';

import { roomCoordinator } from '../../../client/lib/rooms/roomCoordinator';
import { slashCommands } from '../../utils/lib/slashCommand';
import { Subscriptions, ChatSubscription } from '../../models/client';

function Open(_command: 'open', params: string, _item: IMessage): void {
	const dict: Record<string, string[]> = {
		'#': ['c', 'p'],
		'@': ['d'],
	};

	const room = params.trim().replace(/#|@/, '');
	const type = dict[params.trim()[0]] || [];

	const query = {
		name: room,
		...(type && { t: { $in: type } }),
	};

	const subscription = ChatSubscription.findOne(query);

	if (subscription) {
		roomCoordinator.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
	}

	if (type && type.indexOf('d') === -1) {
		return;
	}
	return Meteor.call('createDirectMessage', room, function (err: Meteor.Error) {
		if (err) {
			return;
		}
		const subscription = Subscriptions.findOne(query);
		roomCoordinator.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
	});
}

slashCommands.add('open', Open, {
	description: 'Opens_a_channel_group_or_direct_message',
	params: 'room_name',
	clientOnly: true,
	permission: ['view-c-room', 'view-c-room', 'view-d-room', 'view-joined-room', 'create-d'],
});
