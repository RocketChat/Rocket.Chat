import { api } from '@rocket.chat/core-services';
import type { IUiKitCoreApp } from '@rocket.chat/core-services';
import type { IMessage } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { processWebhookMessage } from '../../../app/lib/server/functions/processWebhookMessage';
import { addUsersToRoomMethod } from '../../../app/lib/server/methods/addUsersToRoom';
import { i18n } from '../../lib/i18n';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

const retrieveMentionsFromPayload = (stringifiedMentions: string): Exclude<IMessage['mentions'], undefined> => {
	try {
		const mentions = JSON.parse(stringifiedMentions);
		if (!Array.isArray(mentions) || !mentions.length || !('username' in mentions[0])) {
			throw new Error('Invalid payload');
		}
		return mentions;
	} catch (error) {
		throw new Error('Invalid payload');
	}
};

export class MentionModule implements IUiKitCoreApp {
	appId = 'mention-core';

	async blockAction(payload: any): Promise<any> {
		const {
			actionId,
			payload: { value: stringifiedMentions, blockId: referenceMessageId },
		} = payload;

		const mentions = retrieveMentionsFromPayload(stringifiedMentions);

		const usernames = mentions.map(({ username }) => username);

		if (actionId === 'dismiss') {
			void api.broadcast('notify.ephemeralMessage', payload.user._id, payload.room, {
				msg: i18n.t('You_mentioned___mentions__but_theyre_not_in_this_room', {
					mentions: `@${usernames.join(', @')}`,
				}),
				_id: payload.message,
				mentions,
			});
			return;
		}

		if (actionId === 'add-users') {
			void addUsersToRoomMethod(payload.user._id, { rid: payload.room, users: usernames as string[] }, payload.user);
			void api.broadcast('notify.ephemeralMessage', payload.user._id, payload.room, {
				msg: i18n.t('You_mentioned___mentions__but_theyre_not_in_this_room', {
					mentions: `@${usernames.join(', @')}`,
				}),
				_id: payload.message,
				mentions,
			});
			return;
		}

		if (actionId === 'share-message') {
			const sub = await Subscriptions.findOneByRoomIdAndUserId(payload.room, payload.user._id);
			// this should exist since the event is fired from withing the room (e.g the user sent a message)
			if (!sub) {
				throw new Error('Failed to retrieve room information');
			}

			const roomPath = roomCoordinator.getRouteLink(sub.t, { rid: sub.rid });
			if (!roomPath) {
				throw new Error('Failed to retrieve path to room');
			}

			const link = new URL(Meteor.absoluteUrl(roomPath));
			link.searchParams.set('msg', referenceMessageId);
			const text = `[ ](${link.toString()})`;

			// forwards message to all DMs
			await processWebhookMessage(
				{
					roomId: mentions.map(({ _id }) => _id),
					text,
				},
				payload.user,
			);

			void api.broadcast('notify.ephemeralMessage', payload.user._id, payload.room, {
				msg: i18n.t('You_mentioned___mentions__but_theyre_not_in_this_room_You_let_them_know_via_dm', {
					mentions: `@${usernames.join(', @')}`,
				}),
				_id: payload.message,
				mentions,
			});
		}
	}
}
