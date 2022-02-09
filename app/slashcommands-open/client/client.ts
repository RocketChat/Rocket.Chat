import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { roomTypes } from '../../utils/client';
import { slashCommands } from '../../utils/lib/slashCommand';
import { Subscriptions, ChatSubscription } from '../../models/client';

function Open(_command: 'open', params: string, _item: Record<string, string>): void {
	const dict: Record<string, string[]> = {
		'#': ['c', 'p'],
		'@': ['d'],
	};

	let room = params.trim();
	const type = dict[room[0]];
	room = room.replace(/#|@/, '');
	const query = {
		name: room,
		t: {},
	};

	if (type) {
		query.t = {
			$in: type,
		};
	}

	const subscription = ChatSubscription.findOne(query);

	if (subscription) {
		roomTypes.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
	}

	if (type && type.indexOf('d') === -1) {
		return;
	}
	return Meteor.call('createDirectMessage', room, function (err: Meteor.Error) {
		if (err) {
			return;
		}
		const subscription = Subscriptions.findOne(query);
		roomTypes.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
	});
}

slashCommands.add(
	'open',
	Open,
	{
		description: 'Opens_a_channel_group_or_direct_message',
		params: 'room_name',
		clientOnly: true,
		permission: ['view-c-room', 'view-c-room', 'view-d-room', 'view-joined-room', 'create-d'],
	},
	undefined,
	false,
	undefined,
	undefined,
);
