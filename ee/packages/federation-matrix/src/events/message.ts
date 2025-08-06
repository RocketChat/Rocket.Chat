import type { HomeserverEventSignatures } from '@hs/federation-sdk';
import { FederationMatrix, Message } from '@rocket.chat/core-services';
import { UserStatus } from '@rocket.chat/core-typings';
import type { IUser } from '@rocket.chat/core-typings';
import type { Emitter } from '@rocket.chat/emitter';
import { Logger } from '@rocket.chat/logger';
import { Users, MatrixBridgedUser, MatrixBridgedRoom, Rooms, Subscriptions, Messages } from '@rocket.chat/models';

const logger = new Logger('federation-matrix:message');

export function message(emitter: Emitter<HomeserverEventSignatures>) {
	emitter.on('homeserver.matrix.message', async (data) => {
		try {
			const message = data.content?.body?.toString();
			if (!message) {
				logger.debug('No message found in event content');
				return;
			}

			const content = data.content as any;
			const threadRelation = content?.['m.relates_to'];
			const isThreadMessage = threadRelation?.rel_type === 'm.thread';
			const threadRootEventId = isThreadMessage ? threadRelation.event_id : undefined;

			const [userPart, domain] = data.sender.split(':');
			if (!userPart || !domain) {
				logger.error('Invalid Matrix sender ID format:', data.sender);
				return;
			}
			const username = userPart.substring(1);

			let user = await Users.findOneByUsername(data.sender);

			if (!user) {
				logger.info('Creating new federated user:', { username: data.sender, externalId: data.sender });

				const userData: Partial<IUser> = {
					username: data.sender,
					name: username, // TODO: Fetch display name from Matrix profile
					type: 'user',
					status: UserStatus.ONLINE,
					active: true,
					roles: ['user'],
					requirePasswordChange: false,
					federated: true, // Mark as federated user
					createdAt: new Date(),
					_updatedAt: new Date(),
				};

				const { insertedId } = await Users.insertOne(userData as IUser);

				await MatrixBridgedUser.createOrUpdateByLocalId(
					insertedId,
					data.sender,
					true, // isRemote = true for external Matrix users
					domain,
				);

				user = await Users.findOneById(insertedId);
				if (!user) {
					logger.error('Failed to create user:', data.sender);
					return;
				}

				logger.info('Successfully created federated user:', { userId: user._id, username });
			} else {
				await MatrixBridgedUser.createOrUpdateByLocalId(user._id, data.sender, false, domain);
			}

			const internalRoomId = await MatrixBridgedRoom.getLocalRoomId(data.room_id);
			if (!internalRoomId) {
				logger.error('Room not found in bridge mapping:', data.room_id);
				// TODO: Handle room creation for unknown federated rooms
				return;
			}

			const room = await Rooms.findOneById(internalRoomId);
			if (!room) {
				logger.error('Room not found:', internalRoomId);
				return;
			}

			if (!room.federated) {
				logger.error('Room is not marked as federated:', { roomId: room._id, matrixRoomId: data.room_id });
				// TODO: Should we update the room to be federated?
			}

			const existingSubscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, user._id);

			if (!existingSubscription) {
				logger.info('Creating subscription for federated user in room:', { userId: user._id, roomId: room._id });

				const { insertedId } = await Subscriptions.createWithRoomAndUser(room, user, {
					ts: new Date(),
					open: false,
					alert: false,
					unread: 0,
					userMentions: 0,
					groupMentions: 0,
					// Federation status is inherited from room.federated and user.federated
				});

				if (insertedId) {
					logger.debug('Successfully created subscription:', insertedId);
					// TODO: Import and use notifyOnSubscriptionChangedById if needed
					// void notifyOnSubscriptionChangedById(insertedId, 'inserted');
				}
			}

			let tmid: string | undefined;
			if (isThreadMessage && threadRootEventId) {
				const threadRootMessage = await Messages.findOneByFederationId(threadRootEventId);
				if (threadRootMessage) {
					tmid = threadRootMessage._id;
					logger.debug('Found thread root message:', { tmid, threadRootEventId });
				} else {
					logger.warn('Thread root message not found for event:', threadRootEventId);
				}
			}

			const isEditedMessage = data.content['m.relates_to']?.rel_type === 'm.replace';
			if (isEditedMessage && data.content['m.relates_to']?.event_id && data.content['m.new_content']) {
				logger.debug('Received edited message from Matrix, updating existing message');
				const originalMessage = await Messages.findOneByFederationId(data.content['m.relates_to'].event_id);
				if (!originalMessage) {
					logger.error('Original message not found for edit:', data.content['m.relates_to'].event_id);
					return;
				}
				if (originalMessage.federation?.eventId !== data.content['m.relates_to'].event_id) {
					return;
				}
				if (originalMessage.msg === data.content['m.new_content']?.body) {
					logger.debug('No changes in message content, skipping update');
					return;
				}

				await Message.updateMessage(
					{
						...originalMessage,
						msg: data.content['m.new_content']?.body,
					},
					user,
					originalMessage,
				);
				return;
			}

			await Message.saveMessageFromFederation({
				fromId: user._id,
				rid: internalRoomId,
				msg: message,
				federation_event_id: data.event_id,
				tmid,
			});
		} catch (error) {
			logger.error('Error processing Matrix message:', error);
		}
	});

	emitter.on('homeserver.matrix.redaction', async (data) => {
		try {
			const redactedEventId = data.redacts;
			if (!redactedEventId) {
				logger.debug('No redacts field in redaction event');
				return;
			}

			const messageEvent = await FederationMatrix.getEventById(redactedEventId);
			if (!messageEvent || messageEvent.type !== 'm.room.message') {
				logger.debug(`Event ${redactedEventId} is not a message event`);
				return;
			}

			const rcMessage = await Messages.findOneByFederationId(data.redacts);
			if (!rcMessage) {
				logger.debug(`No RC message found for event ${data.redacts}`);
				return;
			}

			const user = await Users.findOneByUsername(data.sender);
			if (!user) {
				logger.debug(`User not found: ${data.sender}`);
				return;
			}

			await Message.deleteMessage(user, rcMessage);
		} catch (error) {
			logger.error('Failed to process Matrix removal redaction:', error);
		}
	});
}
