import { api } from '@rocket.chat/core-services';
import type { IMessage } from '@rocket.chat/core-typings';
import { isDirectMessageRoom, isEditedMessage, isOmnichannelRoom, isRoomFederated } from '@rocket.chat/core-typings';
import { Subscriptions, Users } from '@rocket.chat/models';
import type { ActionsBlock } from '@rocket.chat/ui-kit';
import moment from 'moment';

import { callbacks } from '../../../../lib/callbacks';
import { getUserDisplayName } from '../../../../lib/getUserDisplayName';
import { isTruthy } from '../../../../lib/isTruthy';
import { i18n } from '../../../../server/lib/i18n';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { settings } from '../../../settings/server';

const APP_ID = 'mention-core';
const getBlocks = (mentions: IMessage['mentions'], messageId: string, lng: string | undefined) => {
	const stringifiedMentions = JSON.stringify(mentions);
	return {
		addUsersBlock: {
			type: 'button',
			appId: APP_ID,
			blockId: messageId,
			value: stringifiedMentions,
			actionId: 'add-users',
			text: {
				type: 'plain_text',
				text: i18n.t('Add_them', undefined, lng),
			},
		},
		dismissBlock: {
			type: 'button',
			appId: APP_ID,
			blockId: messageId,
			value: stringifiedMentions,
			actionId: 'dismiss',
			text: {
				type: 'plain_text',
				text: i18n.t('Do_nothing', undefined, lng),
			},
		},
		dmBlock: {
			type: 'button',
			appId: APP_ID,
			value: stringifiedMentions,
			blockId: messageId,
			actionId: 'share-message',
			text: {
				type: 'plain_text',
				text: i18n.t('Let_them_know', undefined, lng),
			},
		},
	} as const;
};

callbacks.add(
	'afterSaveMessage',
	async (message, { room }) => {
		// TODO: check if I need to test this 60 second rule.
		// If the message was edited, or is older than 60 seconds (imported)
		// the notifications will be skipped, so we can also skip this validation
		if (isEditedMessage(message) || (message.ts && Math.abs(moment(message.ts).diff(moment())) > 60000) || !message.mentions) {
			return message;
		}

		const mentions = message.mentions.filter(({ _id, type }) => _id !== 'all' && _id !== 'here' && type !== 'team');
		if (!mentions.length) {
			return message;
		}

		if (isDirectMessageRoom(room) || isRoomFederated(room) || isOmnichannelRoom(room)) {
			return message;
		}

		const subs = await Subscriptions.findByRoomIdAndUserIds(
			message.rid,
			mentions.map(({ _id }) => _id),
			{ projection: { u: 1 } },
		).toArray();

		// get all users that are mentioned but not in the channel
		const mentionsUsersNotInChannel = mentions.filter(({ _id }) => !subs.some((sub) => sub.u._id === _id));

		if (!mentionsUsersNotInChannel.length) {
			return message;
		}

		const canAddUsersToThisRoom = await hasPermissionAsync(message.u._id, 'add-user-to-joined-room', message.rid);
		const canAddToAnyRoom = await (room.t === 'c'
			? hasPermissionAsync(message.u._id, 'add-user-to-any-c-room')
			: hasPermissionAsync(message.u._id, 'add-user-to-any-p-room'));
		const canDMUsers = await hasPermissionAsync(message.u._id, 'create-d'); // TODO: Perhaps check if user has DM with mentioned user (might be too expensive)
		const canAddUsers = canAddUsersToThisRoom || canAddToAnyRoom;

		const { language } = (await Users.findOneById(message.u._id)) || {};

		const actionBlocks = getBlocks(mentionsUsersNotInChannel, message._id, language);
		const elements: ActionsBlock['elements'] = [
			canAddUsers && actionBlocks.addUsersBlock,
			(canAddUsers || canDMUsers) && actionBlocks.dismissBlock,
			canDMUsers && actionBlocks.dmBlock,
		].filter(isTruthy);

		const messageLabel = canAddUsers
			? 'You_mentioned___mentions__but_theyre_not_in_this_room'
			: 'You_mentioned___mentions__but_theyre_not_in_this_room_You_can_ask_a_room_admin_to_add_them';

		const useRealName = settings.get<boolean>('UI_Use_Real_Name');

		const usernamesOrNames = mentionsUsersNotInChannel.map(({ username, name }) => `*${getUserDisplayName(name, username, useRealName)}*`);

		const mentionsText = usernamesOrNames.join(', ');

		// TODO: Mentions style
		void api.broadcast('notify.ephemeralMessage', message.u._id, message.rid, {
			msg: '',
			mentions: mentionsUsersNotInChannel,
			tmid: message.tmid,
			blocks: [
				{
					appId: APP_ID,
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: i18n.t(messageLabel, { mentions: mentionsText }, language),
					},
				} as const,
				Boolean(elements.length) &&
					({
						type: 'actions',
						appId: APP_ID,
						elements,
					} as const),
			].filter(isTruthy),
			private: true,
		});

		return message;
	},
	callbacks.priority.LOW,
	'mention-user-not-in-channel',
);
