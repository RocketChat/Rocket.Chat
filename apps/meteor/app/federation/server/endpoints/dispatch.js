import { api } from '@rocket.chat/core-services';
import { eventTypes } from '@rocket.chat/core-typings';
import { FederationServers, FederationRoomEvents, Rooms, Messages, Subscriptions, Users, ReadReceipts } from '@rocket.chat/models';
import { removeEmpty } from '@rocket.chat/tools';
import EJSON from 'ejson';

import { API } from '../../../api/server';
import { FileUpload } from '../../../file-upload/server';
import { deleteRoom } from '../../../lib/server/functions/deleteRoom';
import { apiDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import {
	notifyOnMessageChange,
	notifyOnRoomChanged,
	notifyOnRoomChangedById,
	notifyOnSubscriptionChanged,
	notifyOnSubscriptionChangedById,
} from '../../../lib/server/lib/notifyListener';
import { notifyUsersOnMessage } from '../../../lib/server/lib/notifyUsersOnMessage';
import { sendAllNotifications } from '../../../lib/server/lib/sendNotificationsOnMessage';
import { processThreads } from '../../../threads/server/hooks/aftersavemessage';
import { getUpload, requestEventsFromLatest } from '../handler';
import { contextDefinitions } from '../lib/context';
import { decryptIfNeeded } from '../lib/crypt';
import { getFederationDomain } from '../lib/getFederationDomain';
import { isFederationEnabled } from '../lib/isFederationEnabled';
import { serverLogger } from '../lib/logger';
import { normalizers } from '../normalizers';

const eventHandlers = {
	//
	// PING
	//
	async [eventTypes.PING]() {
		return {
			success: true,
		};
	},

	//
	// GENESIS
	//
	async [eventTypes.GENESIS](event) {
		switch (event.data.contextType) {
			case contextDefinitions.ROOM.type:
				const eventResult = await FederationRoomEvents.addEvent(event.context, event);

				// If the event was successfully added, handle the event locally
				if (eventResult.success) {
					const {
						data: { room },
					} = event;

					// Check if room exists
					const persistedRoom = await Rooms.findOne({ _id: room._id });

					if (persistedRoom) {
						// Update the federation
						await Rooms.updateOne({ _id: persistedRoom._id }, { $set: { federation: room.federation } });

						// Notify watch.rooms listener
						void notifyOnRoomChangedById(room._id);
					} else {
						// Denormalize room
						const denormalizedRoom = normalizers.denormalizeRoom(room);

						// Create the room
						const insertedRoom = await Rooms.insertOne(denormalizedRoom);

						// Notify watch.rooms listener
						void notifyOnRoomChangedById(insertedRoom.insertedId);
					}
				}
				return eventResult;
		}
	},

	//
	// ROOM_DELETE
	//
	async [eventTypes.ROOM_DELETE](event) {
		const {
			data: { roomId },
		} = event;

		// Check if room exists
		const persistedRoom = await Rooms.findOne({ _id: roomId });

		if (persistedRoom) {
			// Delete the room
			await deleteRoom(roomId);

			// Notify watch.rooms listener
			void notifyOnRoomChanged(persistedRoom, 'removed');
		}

		// Remove all room events
		await FederationRoomEvents.removeRoomEvents(roomId);

		return {
			success: true,
		};
	},

	//
	// ROOM_ADD_USER
	//
	async [eventTypes.ROOM_ADD_USER](event) {
		const eventResult = await FederationRoomEvents.addEvent(event.context, event);

		// We only want to refresh the server list and update the room federation array if something changed
		let federationAltered = false;

		// If the event was successfully added, handle the event locally
		if (eventResult.success) {
			const {
				data: { roomId, user, subscription, domainsAfterAdd },
			} = event;

			// Check if user exists
			const persistedUser = await Users.findOne({ _id: user._id });

			if (persistedUser) {
				// Update the federation, if its not already set (if it's set, this is likely an event being reprocessed)
				if (!persistedUser.federation && user.federation) {
					await Users.updateOne({ _id: persistedUser._id }, { $set: { federation: removeEmpty(user.federation) } });
					federationAltered = true;
				}
			} else {
				// Denormalize user
				const denormalizedUser = normalizers.denormalizeUser(user);

				// Create the user
				await Users.insertOne(denormalizedUser);
				federationAltered = true;
			}

			// Check if subscription exists
			const persistedSubscription = await Subscriptions.findOne({ _id: subscription._id });

			try {
				if (persistedSubscription) {
					// Update the federation, if its not already set (if it's set, this is likely an event being reprocessed
					if (!persistedSubscription.federation && subscription.federation) {
						await Subscriptions.updateOne(
							{ _id: persistedSubscription._id },
							{ $set: { federation: removeEmpty(subscription.federation) } },
						);
						federationAltered = true;
					}
				} else {
					// Denormalize subscription
					const denormalizedSubscription = normalizers.denormalizeSubscription(subscription);

					// Create the subscription
					const { insertedId } = await Subscriptions.insertOne(removeEmpty(denormalizedSubscription));
					if (insertedId) {
						void notifyOnSubscriptionChangedById(insertedId);
					}
					federationAltered = true;
				}
			} catch (ex) {
				serverLogger.debug(`unable to create subscription for user ( ${user._id} ) in room (${roomId})`);
			}

			// Refresh the servers list
			if (federationAltered) {
				await FederationServers.refreshServers();

				// Update the room's federation property
				await Rooms.updateOne({ _id: roomId }, { $set: { 'federation.domains': domainsAfterAdd } });

				// Notify watch.rooms listener
				void notifyOnRoomChangedById(roomId);
			}
		}

		return eventResult;
	},

	//
	// ROOM_REMOVE_USER
	//
	async [eventTypes.ROOM_REMOVE_USER](event) {
		const eventResult = await FederationRoomEvents.addEvent(event.context, event);

		// If the event was successfully added, handle the event locally
		if (eventResult.success) {
			const {
				data: { roomId, user, domainsAfterRemoval },
			} = event;

			// Remove the user's subscription
			const deletedSubscription = await Subscriptions.removeByRoomIdAndUserId(roomId, user._id);
			if (deletedSubscription) {
				void notifyOnSubscriptionChanged(deletedSubscription, 'removed');
			}

			// Refresh the servers list
			await FederationServers.refreshServers();

			// Update the room's federation property
			await Rooms.updateOne({ _id: roomId }, { $set: { 'federation.domains': domainsAfterRemoval } });

			// Notify watch.rooms listener
			void notifyOnRoomChangedById(roomId);
		}

		return eventResult;
	},

	//
	// ROOM_USER_LEFT
	//
	async [eventTypes.ROOM_USER_LEFT](event) {
		const eventResult = await FederationRoomEvents.addEvent(event.context, event);

		// If the event was successfully added, handle the event locally
		if (eventResult.success) {
			const {
				data: { roomId, user, domainsAfterRemoval },
			} = event;

			// Remove the user's subscription
			const deletedSubscription = await Subscriptions.removeByRoomIdAndUserId(roomId, user._id);
			if (deletedSubscription) {
				void notifyOnSubscriptionChanged(deletedSubscription, 'removed');
			}

			// Refresh the servers list
			await FederationServers.refreshServers();

			// Update the room's federation property
			await Rooms.updateOne({ _id: roomId }, { $set: { 'federation.domains': domainsAfterRemoval } });

			// Notify watch.rooms listener
			void notifyOnRoomChangedById(roomId);
		}

		return eventResult;
	},

	//
	// ROOM_MESSAGE
	//
	async [eventTypes.ROOM_MESSAGE](event) {
		const eventResult = await FederationRoomEvents.addEvent(event.context, event);

		// If the event was successfully added, handle the event locally
		if (eventResult.success) {
			const {
				data: { message },
			} = event;

			// Check if message exists
			const persistedMessage = await Messages.findOne({ _id: message._id });
			let messageForNotification;

			if (persistedMessage) {
				// Update the federation
				if (!persistedMessage.federation) {
					await Messages.updateOne({ _id: persistedMessage._id }, { $set: { federation: message.federation } });
					messageForNotification = { ...persistedMessage, federation: message.federation };
				}
			} else {
				// Load the room
				const room = await Rooms.findOneById(message.rid);

				// Denormalize message
				const denormalizedMessage = normalizers.denormalizeMessage(message);

				// Is there a file?
				if (denormalizedMessage.file) {
					const fileStore = FileUpload.getStore('Uploads');

					const {
						federation: { origin },
					} = denormalizedMessage;

					const { upload, buffer } = await getUpload(origin, denormalizedMessage.file._id);

					const oldUploadId = upload._id;

					// Normalize upload
					delete upload._id;
					upload.rid = denormalizedMessage.rid;
					upload.userId = denormalizedMessage.u._id;
					upload.federation = {
						_id: denormalizedMessage.file._id,
						origin,
					};

					await fileStore.insert(upload, buffer);

					// Update the message's file
					denormalizedMessage.file._id = upload._id;

					// Update the message's attachments dependent on type
					for (const attachment of denormalizedMessage.attachments) {
						attachment.title_link = attachment.title_link.replace(oldUploadId, upload._id);
						if (/^image\/.+/.test(denormalizedMessage.file.type)) {
							attachment.image_url = attachment.image_url.replace(oldUploadId, upload._id);
						} else if (/^audio\/.+/.test(denormalizedMessage.file.type)) {
							attachment.audio_url = attachment.audio_url.replace(oldUploadId, upload._id);
						} else if (/^video\/.+/.test(denormalizedMessage.file.type)) {
							attachment.video_url = attachment.video_url.replace(oldUploadId, upload._id);
						}
					}
				}

				// Create the message
				try {
					await Messages.insertOne(denormalizedMessage);

					await processThreads(denormalizedMessage, room);

					const roomUpdater = Rooms.getUpdater();
					await notifyUsersOnMessage(denormalizedMessage, room, roomUpdater);
					if (roomUpdater.hasChanges()) {
						await Rooms.updateFromUpdater({ _id: room._id }, roomUpdater);
					}

					sendAllNotifications(denormalizedMessage, room);
					messageForNotification = denormalizedMessage;
				} catch (err) {
					serverLogger.debug(`Error on creating message: ${message._id}`);
				}
			}
			if (messageForNotification) {
				void notifyOnMessageChange({
					id: messageForNotification._id,
					data: messageForNotification,
				});
			}
		}

		return eventResult;
	},

	//
	// ROOM_EDIT_MESSAGE
	//
	async [eventTypes.ROOM_EDIT_MESSAGE](event) {
		const eventResult = await FederationRoomEvents.addEvent(event.context, event);

		// If the event was successfully added, handle the event locally
		if (eventResult.success) {
			const {
				data: { message },
			} = event;

			// Check if message exists
			const persistedMessage = await Messages.findOne({ _id: message._id });

			if (!persistedMessage) {
				eventResult.success = false;
				eventResult.reason = 'missingMessageToEdit';
			} else {
				// Update the message
				await Messages.updateOne({ _id: persistedMessage._id }, { $set: { msg: message.msg, federation: message.federation } });
				void notifyOnMessageChange({
					id: persistedMessage._id,
					data: {
						...persistedMessage,
						msg: message.msg,
						federation: message.federation,
					},
				});
			}
		}

		return eventResult;
	},

	//
	// ROOM_DELETE_MESSAGE
	//
	async [eventTypes.ROOM_DELETE_MESSAGE](event) {
		const eventResult = await FederationRoomEvents.addEvent(event.context, event);

		// If the event was successfully added, handle the event locally
		if (eventResult.success) {
			const {
				data: { roomId, messageId },
			} = event;

			// Remove the message
			await Messages.removeById(messageId);
			await ReadReceipts.removeByMessageId(messageId);

			// Notify the room
			void api.broadcast('notify.deleteMessage', roomId, { _id: messageId });
		}

		return eventResult;
	},

	//
	// ROOM_SET_MESSAGE_REACTION
	//
	async [eventTypes.ROOM_SET_MESSAGE_REACTION](event) {
		const eventResult = await FederationRoomEvents.addEvent(event.context, event);

		// If the event was successfully added, handle the event locally
		if (eventResult.success) {
			const {
				data: { messageId, username, reaction },
			} = event;

			// Get persisted message
			const persistedMessage = await Messages.findOne({ _id: messageId });

			// Make sure reactions exist
			persistedMessage.reactions = persistedMessage.reactions || {};

			let reactionObj = persistedMessage.reactions[reaction];

			// If there are no reactions of that type, add it
			if (!reactionObj) {
				reactionObj = {
					usernames: [username],
				};
			} else {
				// Otherwise, add the username
				reactionObj.usernames.push(username);
				reactionObj.usernames = [...new Set(reactionObj.usernames)];
			}

			// Update the property
			await Messages.updateOne({ _id: messageId }, { $set: { [`reactions.${reaction}`]: reactionObj } });
			void notifyOnMessageChange({
				id: persistedMessage._id,
				data: {
					...persistedMessage,
					reactions: {
						...persistedMessage.reactions,
						[reaction]: reactionObj,
					},
				},
			});
		}

		return eventResult;
	},

	//
	// ROOM_UNSET_MESSAGE_REACTION
	//
	async [eventTypes.ROOM_UNSET_MESSAGE_REACTION](event) {
		const eventResult = await FederationRoomEvents.addEvent(event.context, event);

		// If the event was successfully added, handle the event locally
		if (eventResult.success) {
			const {
				data: { messageId, username, reaction },
			} = event;

			// Get persisted message
			const persistedMessage = await Messages.findOne({ _id: messageId });

			// Make sure reactions exist
			persistedMessage.reactions = persistedMessage.reactions || {};

			// If there are no reactions of that type, ignore
			if (!persistedMessage.reactions[reaction]) {
				return eventResult;
			}

			const reactionObj = persistedMessage.reactions[reaction];

			// Get the username index on the list
			const usernameIdx = reactionObj.usernames.indexOf(username);

			// If the index is not found, ignore
			if (usernameIdx === -1) {
				return eventResult;
			}

			// Remove the username from the given reaction
			reactionObj.usernames.splice(usernameIdx, 1);

			// If there are no more users for that reaction, remove the property
			if (reactionObj.usernames.length === 0) {
				await Messages.updateOne({ _id: messageId }, { $unset: { [`reactions.${reaction}`]: 1 } });
			} else {
				// Otherwise, update the property
				await Messages.updateOne({ _id: messageId }, { $set: { [`reactions.${reaction}`]: reactionObj } });
			}
			void notifyOnMessageChange({
				id: persistedMessage._id,
				data: {
					...persistedMessage,
					reactions: {
						...persistedMessage.reactions,
						[reaction]: reactionObj,
					},
				},
			});
		}

		return eventResult;
	},

	//
	// ROOM_MUTE_USER
	//
	async [eventTypes.ROOM_MUTE_USER](event) {
		const eventResult = await FederationRoomEvents.addEvent(event.context, event);

		// If the event was successfully added, handle the event locally
		if (eventResult.success) {
			const {
				data: { roomId, user },
			} = event;

			// Denormalize user
			const denormalizedUser = normalizers.denormalizeUser(user);

			// Mute user
			await Rooms.muteUsernameByRoomId(roomId, denormalizedUser.username);

			// Broadcast the unmute event
			void notifyOnRoomChangedById(roomId);
		}

		return eventResult;
	},

	//
	// ROOM_UNMUTE_USER
	//
	async [eventTypes.ROOM_UNMUTE_USER](event) {
		const eventResult = await FederationRoomEvents.addEvent(event.context, event);

		// If the event was successfully added, handle the event locally
		if (eventResult.success) {
			const {
				data: { roomId, user },
			} = event;

			// Denormalize user
			const denormalizedUser = normalizers.denormalizeUser(user);

			// Unmute user
			await Rooms.unmuteMutedUsernameByRoomId(roomId, denormalizedUser.username);

			// Broadcast the unmute event
			void notifyOnRoomChangedById(roomId);
		}

		return eventResult;
	},
};

API.v1.addRoute(
	'federation.events.dispatch',
	{ authRequired: false, rateLimiterOptions: { numRequestsAllowed: 30, intervalTimeInMS: 1000 } },
	{
		async post() {
			/*
			The legacy federation has been deprecated for over a year
			and no longer receives any updates. This feature also has
			relevant security issues that weren't addressed.
			Workspaces should migrate to the newer matrix federation.
			*/
			apiDeprecationLogger.endpoint(this.request.route, '8.0.0', this.response, 'Use Matrix Federation instead.');

			if (!process.env.ENABLE_INSECURE_LEGACY_FEDERATION) {
				return API.v1.failure('Deprecated. ENABLE_INSECURE_LEGACY_FEDERATION environment variable is needed to enable it.');
			}

			if (!isFederationEnabled()) {
				return API.v1.failure('Federation not enabled');
			}

			//
			// Decrypt the payload if needed
			let payload;

			try {
				payload = await decryptIfNeeded(this.request, this.bodyParams);
			} catch (err) {
				return API.v1.failure('Could not decrypt payload');
			}

			//
			// Convert from EJSON
			const { events } = EJSON.fromJSONValue(payload);

			serverLogger.debug({ msg: 'federation.events.dispatch', events });

			// Loop over received events
			for (const event of events) {
				/* eslint-disable no-await-in-loop */

				let eventResult;

				if (eventHandlers[event.type]) {
					eventResult = await eventHandlers[event.type](event);
				}

				// If there was an error handling the event, take action
				if (!eventResult || !eventResult.success) {
					try {
						serverLogger.debug({
							msg: 'federation.events.dispatch => Event has missing parents',
							event,
						});

						await requestEventsFromLatest(
							event.origin,
							getFederationDomain(),
							contextDefinitions.defineType(event),
							event.context,
							eventResult.latestEventIds,
						);

						// And stop handling the events
						break;
					} catch (err) {
						serverLogger.error({ msg: 'dispatch', event, eventResult, err });

						throw err;
					}
				}

				/* eslint-enable no-await-in-loop */
			}

			// Respond
			return API.v1.success();
		},
	},
);
