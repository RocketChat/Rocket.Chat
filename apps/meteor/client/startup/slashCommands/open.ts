import type { RoomType, ISubscription, SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { sdk } from '../../lib/SDKClient';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { slashCommands } from '../../lib/slashCommand';
import { router } from '../../providers/RouterProvider';
import { Subscriptions } from '../../stores';

slashCommands.add({
	command: 'open',
	callback: async function Open({ params }: SlashCommandCallbackParams<'open'>): Promise<void> {
		const dict: Record<string, RoomType[]> = {
			'#': ['c', 'p'],
			'@': ['d'],
		};

		const room = params.trim().replace(/#|@/, '');
		const type = dict[params.trim()[0]] || [];

		const predicate = ({ name, t }: ISubscription) => {
			return name === room && (type.length ? type.includes(t) : true);
		};

		const subscription = Subscriptions.state.find(predicate);

		if (subscription) {
			roomCoordinator.openRouteLink(subscription.t, subscription, router.getSearchParameters());
		}

		if (type?.indexOf('d') === -1) {
			return;
		}
		try {
			await sdk.rest.post('/v1/im.create', { username: room });
			const subscription = Subscriptions.state.find(predicate);
			if (!subscription) {
				return;
			}
			roomCoordinator.openRouteLink(subscription.t, subscription, router.getSearchParameters());
		} catch (err: unknown) {
			// noop
		}
	},
	options: {
		description: 'Opens_a_channel_group_or_direct_message',
		params: 'room_name',
		clientOnly: true,
		permission: ['view-c-room', 'view-c-room', 'view-d-room', 'view-joined-room', 'create-d'],
	},
});
