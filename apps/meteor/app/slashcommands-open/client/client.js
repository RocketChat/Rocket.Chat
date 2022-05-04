import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { slashCommands } from '../../utils';
import { roomCoordinator } from '../../../client/lib/rooms/roomCoordinator';
import { ChatSubscription, Subscriptions } from '../../models';

function Open(command, params /* , item*/) {
	const dict = {
		'#': ['c', 'p'],
		'@': ['d'],
	};

	if (command !== 'open' || !Match.test(params, String)) {
		return;
	}

	let room = params.trim();
	const type = dict[room[0]];
	room = room.replace(/#|@/, '');

	const query = {
		name: room,
	};

	if (type) {
		query.t = {
			$in: type,
		};
	}

	const subscription = ChatSubscription.findOne(query);

	if (subscription) {
		roomCoordinator.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
	}

	if (type && type.indexOf('d') === -1) {
		return;
	}
	return Meteor.call('createDirectMessage', room, function (err) {
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
