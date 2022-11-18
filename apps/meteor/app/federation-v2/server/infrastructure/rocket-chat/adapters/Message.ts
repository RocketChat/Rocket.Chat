import { Meteor } from 'meteor/meteor';
import type { IMessage } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';

import { deleteMessage, sendMessage, updateMessage } from '../../../../../lib/server';
import { executeSetReaction } from '../../../../../reactions/server/setReaction';
import type { FederatedRoom } from '../../../domain/FederatedRoom';
import type { FederatedUser } from '../../../domain/FederatedUser';
import { roomCoordinator } from '../../../../../../server/lib/rooms/roomCoordinator';
import { getURL } from '../../../../../utils/server';
import { toInternalQuoteMessageFormat } from '../converters/MessageTextParser';

const DEFAULT_EMOJI_TO_REACT_WHEN_RECEIVED_EMOJI_DOES_NOT_EXIST = ':grey_question:';

export class RocketChatMessageAdapter {
	public async sendMessage(user: FederatedUser, room: FederatedRoom, messageText: string, externalEventId: string): Promise<void> {
		sendMessage(user.getInternalReference(), { federation: { eventId: externalEventId }, msg: messageText }, room.getInternalReference());
	}

	public async sendQuoteMessage(
		user: FederatedUser,
		federatedRoom: FederatedRoom,
		messageText: string,
		externalEventId: string,
		messageToReplyTo: IMessage,
		homeServerDomain: string,
	): Promise<void> {
		const room = federatedRoom.getInternalReference();
		const messageToReplyToUrl = getURL(
			`${roomCoordinator.getRouteLink(room.t as string, { rid: room._id, name: room.name })}?msg=${messageToReplyTo._id}`,
			{ full: true },
		);
		sendMessage(
			user.getInternalReference(),
			{
				federation: { eventId: externalEventId },
				msg: await toInternalQuoteMessageFormat({
					messageToReplyToUrl,
					message: messageText,
					homeServerDomain,
				}),
			},
			room,
		);
	}

	public async editMessage(user: FederatedUser, newMessageText: string, originalMessage: IMessage): Promise<void> {
		const updatedMessage = Object.assign({}, originalMessage, { msg: newMessageText });
		updateMessage(updatedMessage, user.getInternalReference(), originalMessage);
	}

	public async sendFileMessage(
		user: FederatedUser,
		room: FederatedRoom,
		files: IMessage['files'],
		attachments: IMessage['attachments'],
		externalEventId: string,
	): Promise<void> {
		sendMessage(
			user.getInternalReference(),
			{
				federation: { eventId: externalEventId },
				rid: room.getInternalId(),
				ts: new Date(),
				file: (files || [])[0],
				files,
				attachments,
			},
			room.getInternalReference(),
		);
	}

	public async sendQuoteFileMessage(
		user: FederatedUser,
		federatedRoom: FederatedRoom,
		files: IMessage['files'],
		attachments: IMessage['attachments'],
		externalEventId: string,
		messageToReplyTo: IMessage,
		homeServerDomain: string,
	): Promise<void> {
		const room = federatedRoom.getInternalReference();
		const messageToReplyToUrl = getURL(
			`${roomCoordinator.getRouteLink(room.t as string, { rid: room._id, name: room.name })}?msg=${messageToReplyTo._id}`,
			{ full: true },
		);

		sendMessage(
			user.getInternalReference(),
			{
				federation: { eventId: externalEventId },
				rid: federatedRoom.getInternalId(),
				ts: new Date(),
				file: (files || [])[0],
				files,
				attachments,
				msg: await toInternalQuoteMessageFormat({
					messageToReplyToUrl,
					message: '',
					homeServerDomain,
				}),
			},
			room,
		);
	}

	public async deleteMessage(message: IMessage, user: FederatedUser): Promise<void> {
		deleteMessage(message, user.getInternalReference());
	}

	public async reactToMessage(user: FederatedUser, message: IMessage, reaction: string, externalEventId: string): Promise<void> {
		// we need to run this as the user due to a high coupling in this function that relies on the logged in user
		Meteor.runAsUser(user.getInternalId(), async () => {
			try {
				await executeSetReaction(reaction, message._id);
				user.getUsername() &&
					(await Messages.setFederationReactionEventId(user.getUsername() as string, message._id, reaction, externalEventId));
			} catch (error: any) {
				if (error?.message?.includes('Invalid emoji provided.')) {
					await executeSetReaction(DEFAULT_EMOJI_TO_REACT_WHEN_RECEIVED_EMOJI_DOES_NOT_EXIST, message._id);
				}
			}
		});
	}

	public async unreactToMessage(user: FederatedUser, message: IMessage, reaction: string, externalEventId: string): Promise<void> {
		// we need to run this as the user due to a high coupling in this function that relies on the logged in user
		Meteor.runAsUser(user.getInternalId(), async () => {
			await executeSetReaction(reaction, message._id);
			await Messages.unsetFederationReactionEventId(externalEventId, message._id, reaction);
		});
	}

	public async findOneByFederationIdOnReactions(federationEventId: string, user: FederatedUser): Promise<IMessage | null | undefined> {
		return (
			(user.getUsername() && Messages.findOneByFederationIdAndUsernameOnReactions(federationEventId, user.getUsername() as string)) ||
			undefined
		);
	}

	public async getMessageByFederationId(federationEventId: string): Promise<IMessage | null> {
		return Messages.findOneByFederationId(federationEventId);
	}

	public async setExternalFederationEventOnMessage(messageId: string, federationEventId: string): Promise<void> {
		return Messages.setFederationEventIdById(messageId, federationEventId);
	}

	public async unsetExternalFederationEventOnMessageReaction(externalEventId: string, message: IMessage, reaction: string): Promise<void> {
		await Messages.unsetFederationReactionEventId(externalEventId, message._id, reaction);
	}

	public async getMessageById(internalMessageId: string): Promise<IMessage | null> {
		return Messages.findOneById(internalMessageId);
	}

	public async setExternalFederationEventOnMessageReaction(
		username: string,
		message: IMessage,
		reaction: string,
		externalEventId: string,
	): Promise<void> {
		await Messages.setFederationReactionEventId(username, message._id, reaction, externalEventId);
	}
}
