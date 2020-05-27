import { Meteor } from 'meteor/meteor';
import { EJSON } from 'meteor/ejson';

import { API } from '../../../../server/api';
import { logger } from '../lib/logger';
import { contextDefinitions, eventTypes } from '../../../models/server/models/FederationEvents';
import {
	FederationRoomEvents, FederationServers,
	Messages,
	Rooms,
	Subscriptions,
	Users,
} from '../../../models/server';
import { normalizers } from '../normalizers';
import { deleteRoom } from '../../../lib/server/functions';
import { Notifications } from '../../../notifications/server';
import { FileUpload } from '../../../file-upload';
import { getFederationDomain } from '../lib/getFederationDomain';
import { decryptIfNeeded } from '../lib/crypt';
import { isFederationEnabled } from '../lib/isFederationEnabled';
import { getUpload, requestEventsFromLatest } from '../handler';
import { notifyUsersOnMessage } from '../../../lib/server/lib/notifyUsersOnMessage';
import { sendAllNotifications } from '../../../lib/server/lib/sendNotificationsOnMessage';

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
					const { data: { room } } = event;

					// Check if room exists
					const persistedRoom = Rooms.findOne({ _id: room._id });

					if (persistedRoom) {
						// Update the federation
						Rooms.update({ _id: persistedRoom._id }, { $set: { federation: room.federation } });
					} else {
						// Denormalize room
						const denormalizedRoom = normalizers.denormalizeRoom(room);

						// Create the room
						Rooms.insert(denormalizedRoom);
					}
				}
				return eventResult;
		}
	},

	//
	// ROOM_DELETE
	//
	async [eventTypes.ROOM_DELETE](event) {
		const { data: { roomId } } = event;

		// Check if room exists
		const persistedRoom = Rooms.findOne({ _id: roomId });

		if (persistedRoom) {
			// Delete the room
			deleteRoom(roomId);
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

		// If the event was successfully added, handle the event locally
		if (eventResult.success) {
			const { data: { roomId, user, subscription, domainsAfterAdd } } = event;

			// Check if user exists
			const persistedUser = Users.findOne({ _id: user._id });

			if (persistedUser) {
				// Update the federation
				Users.update({ _id: persistedUser._id }, { $set: { federation: user.federation } });
			} else {
				// Denormalize user
				const denormalizedUser = normalizers.denormalizeUser(user);

				// Create the user
				Users.insert(denormalizedUser);
			}

			// Check if subscription exists
			const persistedSubscription = Subscriptions.findOne({ _id: subscription._id });

			if (persistedSubscription) {
				// Update the federation
				Subscriptions.update({ _id: persistedSubscription._id }, { $set: { federation: subscription.federation } });
			} else {
				// Denormalize subscription
				const denormalizedSubscription = normalizers.denormalizeSubscription(subscription);

				// Create the subscription
				Subscriptions.insert(denormalizedSubscription);
			}

			// Refresh the servers list
			FederationServers.refreshServers();

			// Update the room's federation property
			Rooms.update({ _id: roomId }, { $set: { 'federation.domains': domainsAfterAdd } });
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
			const { data: { roomId, user, domainsAfterRemoval } } = event;

			// Remove the user's subscription
			Subscriptions.removeByRoomIdAndUserId(roomId, user._id);

			// Refresh the servers list
			FederationServers.refreshServers();

			// Update the room's federation property
			Rooms.update({ _id: roomId }, { $set: { 'federation.domains': domainsAfterRemoval } });
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
			const { data: { roomId, user, domainsAfterRemoval } } = event;

			// Remove the user's subscription
			Subscriptions.removeByRoomIdAndUserId(roomId, user._id);

			// Refresh the servers list
			FederationServers.refreshServers();

			// Update the room's federation property
			Rooms.update({ _id: roomId }, { $set: { 'federation.domains': domainsAfterRemoval } });
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
			const { data: { message } } = event;

			// Check if message exists
			const persistedMessage = Messages.findOne({ _id: message._id });

			if (persistedMessage) {
				// Update the federation
				Messages.update({ _id: persistedMessage._id }, { $set: { federation: message.federation } });
			} else {
				// Load the room
				const room = Rooms.findOneById(message.rid);

				// Denormalize message
				const denormalizedMessage = normalizers.denormalizeMessage(message);

				// Is there a file?
				if (denormalizedMessage.file) {
					const fileStore = FileUpload.getStore('Uploads');

					const { federation: { origin } } = denormalizedMessage;

					const { upload, buffer } = getUpload(origin, denormalizedMessage.file._id);

					const oldUploadId = upload._id;

					// Normalize upload
					delete upload._id;
					upload.rid = denormalizedMessage.rid;
					upload.userId = denormalizedMessage.u._id;
					upload.federation = {
						_id: denormalizedMessage.file._id,
						origin,
					};

					Meteor.runAsUser(upload.userId, () => Meteor.wrapAsync(fileStore.insert.bind(fileStore))(upload, buffer));

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
				Messages.insert(denormalizedMessage);

				// Notify users
				notifyUsersOnMessage(denormalizedMessage, room);
				sendAllNotifications(denormalizedMessage, room);
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
			const { data: { message } } = event;

			// Check if message exists
			const persistedMessage = Messages.findOne({ _id: message._id });

			if (!persistedMessage) {
				eventResult.success = false;
				eventResult.reason = 'missingMessageToEdit';
			} else {
				// Update the message
				Messages.update({ _id: persistedMessage._id }, { $set: { msg: message.msg, federation: message.federation } });
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
			const { data: { roomId, messageId } } = event;

			// Remove the message
			Messages.removeById(messageId);

			// Notify the room
			Notifications.notifyRoom(roomId, 'deleteMessage', { _id: messageId });
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
			const { data: { messageId, username, reaction } } = event;

			// Get persisted message
			const persistedMessage = Messages.findOne({ _id: messageId });

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
			Messages.update({ _id: messageId }, { $set: { [`reactions.${ reaction }`]: reactionObj } });
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
			const { data: { messageId, username, reaction } } = event;

			// Get persisted message
			const persistedMessage = Messages.findOne({ _id: messageId });

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
				Messages.update({ _id: messageId }, { $unset: { [`reactions.${ reaction }`]: 1 } });
			} else {
				// Otherwise, update the property
				Messages.update({ _id: messageId }, { $set: { [`reactions.${ reaction }`]: reactionObj } });
			}
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
			const { data: { roomId, user } } = event;

			// Denormalize user
			const denormalizedUser = normalizers.denormalizeUser(user);

			// Mute user
			Rooms.muteUsernameByRoomId(roomId, denormalizedUser.username);
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
			const { data: { roomId, user } } = event;

			// Denormalize user
			const denormalizedUser = normalizers.denormalizeUser(user);

			// Mute user
			Rooms.unmuteUsernameByRoomId(roomId, denormalizedUser.username);
		}

		return eventResult;
	},
};

API.v1.addRoute('federation.events.dispatch', { authRequired: false }, {
	async post() {
		if (!isFederationEnabled()) {
			return API.v1.failure('Federation not enabled');
		}

		//
		// Decrypt the payload if needed
		let payload;

		try {
			payload = decryptIfNeeded(this.request, this.bodyParams);
		} catch (err) {
			return API.v1.failure('Could not decrypt payload');
		}

		//
		// Convert from EJSON
		const { events } = EJSON.fromJSONValue(payload);

		logger.server.debug(`federation.events.dispatch => events=${ events.map((e) => JSON.stringify(e, null, 2)) }`);

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
					logger.server.debug(`federation.events.dispatch => Event has missing parents -> event=${ JSON.stringify(event, null, 2) }`);

					requestEventsFromLatest(event.origin, getFederationDomain(), contextDefinitions.defineType(event), event.context, eventResult.latestEventIds);

					// And stop handling the events
					break;
				} catch (err) {
					logger.server.error(() => `dispatch => event=${ JSON.stringify(event, null, 2) } eventResult=${ JSON.stringify(eventResult, null, 2) } error=${ err.toString() } ${ err.stack }`);

					throw err;
				}
			}

			/* eslint-enable no-await-in-loop */
		}

		// Respond
		return API.v1.success();
	},
});
