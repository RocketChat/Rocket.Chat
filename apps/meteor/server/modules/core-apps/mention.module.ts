import { api } from '@rocket.chat/core-services';
import type { IUiKitCoreApp, UiKitCoreAppBlockActionPayload } from '@rocket.chat/core-services';
import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { Subscriptions, Messages } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { i18n } from '../../lib/i18n';
import { formatMentionedUsers } from '../../lib/messages/formatMentionedUsers';
import { processWebhookMessage } from '../../lib/messages/processWebhookMessage';
import { giveThreadAccess } from '../../lib/messaging/threads/giveThreadAccess';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { addUsersToRoomMethod } from '../../meteor-methods/rooms/addUsersToRoom';

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

	async blockAction(payload: UiKitCoreAppBlockActionPayload): Promise<undefined> {
		const {
			actionId,
			payload: { value: stringifiedMentions, blockId: referenceMessageId },
		} = payload;

		const user = payload.user!;
		const room = payload.room!;

		const mentions = retrieveMentionsFromPayload(stringifiedMentions as string);

		const usernames = mentions.map(({ username }) => username);

		const message = await Messages.findOneById(referenceMessageId, { projection: { _id: 1, tmid: 1 } });

		if (!message) {
			throw new Error('Mention bot - Failed to retrieve message information');
		}

		const joinedUsernames = `@${usernames.join(', @')}`;

		if (actionId === 'give-thread-access' || actionId === 'dismiss-thread-access') {
			if (!message.tmid) {
				throw new Error('Mention bot - Message is not in a thread');
			}

			const grantedIds =
				actionId === 'give-thread-access'
					? await giveThreadAccess(
							user._id,
							message.tmid,
							mentions.map(({ _id }) => _id),
						)
					: [];
			const granted = mentions.filter(({ _id }) => grantedIds.includes(_id));
			const notGranted = mentions.filter(({ _id }) => !grantedIds.includes(_id));

			void api.broadcast('notify.ephemeralMessage', user._id, room, {
				msg: [
					granted.length && i18n.t('Thread_access_given', { mentions: formatMentionedUsers(granted), lng: user.language }),
					notGranted.length && i18n.t('Thread_access_not_given', { mentions: formatMentionedUsers(notGranted), lng: user.language }),
				]
					.filter(Boolean)
					.join('\n'),
				_id: payload.message,
				tmid: message.tmid,
				mentions,
			});
			return undefined;
		}

		if (actionId === 'dismiss') {
			void api.broadcast('notify.ephemeralMessage', user._id, room, {
				msg: i18n.t('You_mentioned___mentions__but_theyre_not_in_this_room', {
					mentions: joinedUsernames,
					lng: user.language,
				}),
				_id: payload.message,
				tmid: message.tmid,
				mentions,
			});
			return undefined;
		}

		if (actionId === 'add-users') {
			void addUsersToRoomMethod(user._id, { rid: room, users: usernames as string[] }, user);
			void api.broadcast('notify.ephemeralMessage', user._id, room, {
				msg: i18n.t('You_mentioned___mentions__but_theyre_not_in_this_room', {
					mentions: joinedUsernames,
					lng: user.language,
				}),
				tmid: message.tmid,
				_id: payload.message,
				mentions,
			});
			return undefined;
		}

		if (actionId === 'share-message') {
			const sub = await Subscriptions.findOneByRoomIdAndUserId(room, user._id, { projection: { t: 1, rid: 1, name: 1 } });
			// this should exist since the event is fired from withing the room (e.g the user sent a message)
			if (!sub) {
				throw new Error('Mention bot - Failed to retrieve room information');
			}

			const roomPath = roomCoordinator.getRouteLink(sub.t, { rid: sub.rid, name: sub.name });
			if (!roomPath) {
				throw new Error('Mention bot - Failed to retrieve path to room');
			}

			const messageText = i18n.t('Youre_not_a_part_of__channel__and_I_mentioned_you_there', {
				channel: `#${sub.name}`,
				lng: user.language,
			});

			const link = new URL(Meteor.absoluteUrl(roomPath));
			link.searchParams.set('msg', message._id);
			const text = `[ ](${link.toString()})\n${messageText}`;

			// forwards message to all DMs
			await processWebhookMessage(
				{
					roomId: mentions.map(({ _id }) => _id),
					text,
					separateResponse: true, // so that messages are sent to other DMs even if one or more fails
				},
				user as IUser & { username: string },
			);

			void api.broadcast('notify.ephemeralMessage', user._id, room, {
				msg: i18n.t('You_mentioned___mentions__but_theyre_not_in_this_room_You_let_them_know_via_dm', {
					mentions: joinedUsernames,
					lng: user.language,
				}),
				tmid: message.tmid,
				_id: payload.message,
				mentions,
			});
			return undefined;
		}
	}
}
