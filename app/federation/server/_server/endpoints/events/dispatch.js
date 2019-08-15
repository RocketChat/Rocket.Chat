import { EJSON } from 'meteor/ejson';

import { API } from '../../../../../api/server';
import { Federation } from '../../../federation';
import { logger } from '../../../logger';
import { contextDefinitions, eventTypes } from '../../../../../models/server/models/FederationEvents';
import { FederationRoomEvents, Messages, Rooms, Subscriptions, Users } from '../../../../../models/server';
import { normalizers } from '../../../normalizers';
import { deleteRoom } from '../../../../../lib/server/functions';
import { Notifications } from '../../../../../notifications/server';

API.v1.addRoute('federation.events.dispatch', { authRequired: false }, {
	async post() {
		if (!Federation.enabled) {
			return API.v1.failure('Not found');
		}

		const { events } = EJSON.fromJSONValue(this.bodyParams);

		logger.server.debug(`federation.events.dispatch => events=${ events.map((e) => JSON.stringify(e, null, 2)) }`);

		// Loop over received events
		for (const event of events) {
			/* eslint-disable no-await-in-loop */

			let eventResult;

			switch (event.type) {
				//
				// GENESIS
				//
				case eventTypes.GENESIS:
					switch (event.data.contextType) {
						case contextDefinitions.ROOM.type:
							eventResult = await FederationRoomEvents.addEvent(event.context, event);

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
							break;
					}
					break;

				//
				// ROOM_ADD_USER
				//
				case eventTypes.ROOM_ADD_USER:
					eventResult = await FederationRoomEvents.addEvent(event.context, event);

					// If the event was successfully added, handle the event locally
					if (eventResult.success) {
						const { data: { user, subscription } } = event;

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
					}
					break;

				//
				// ROOM_MESSAGE
				//
				case eventTypes.ROOM_MESSAGE:
					eventResult = await FederationRoomEvents.addEvent(event.context, event);

					// If the event was successfully added, handle the event locally
					if (eventResult.success) {
						const { data: { message } } = event;

						// Check if message exists
						const persistedMessage = Messages.findOne({ _id: message._id });

						if (persistedMessage) {
							// Update the federation
							Messages.update({ _id: persistedMessage._id }, { $set: { federation: message.federation } });
						} else {
							// Update the subscription open status
							Subscriptions.update({ rid: message.rid, name: message.u.username }, { $set: { open: true, alert: true } });

							// Denormalize user
							const denormalizedMessage = normalizers.denormalizeMessage(message);

							// Create the message
							Messages.insert(denormalizedMessage);
						}
					}
					break;

				//
				// ROOM_EDIT_MESSAGE
				//
				case eventTypes.ROOM_EDIT_MESSAGE:
					eventResult = await FederationRoomEvents.addEvent(event.context, event);

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
					break;

				//
				// ROOM_SET_MESSAGE_REACTION
				//
				case eventTypes.ROOM_SET_MESSAGE_REACTION:
					eventResult = await FederationRoomEvents.addEvent(event.context, event);

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
					break;

				//
				// ROOM_UNSET_MESSAGE_REACTION
				//
				case eventTypes.ROOM_UNSET_MESSAGE_REACTION:
					eventResult = await FederationRoomEvents.addEvent(event.context, event);

					// If the event was successfully added, handle the event locally
					if (eventResult.success) {
						const { data: { messageId, username, reaction } } = event;

						// Get persisted message
						const persistedMessage = Messages.findOne({ _id: messageId });

						// Make sure reactions exist
						persistedMessage.reactions = persistedMessage.reactions || {};

						// If there are no reactions of that type, ignore
						if (!persistedMessage.reactions[reaction]) {
							continue;
						}

						const reactionObj = persistedMessage.reactions[reaction];

						// Get the username index on the list
						const usernameIdx = reactionObj.usernames.indexOf(username);

						// If the index is not found, ignore
						if (usernameIdx === -1) {
							continue;
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
					break;

				//
				// ROOM_DELETE_MESSAGE
				//
				case eventTypes.ROOM_DELETE_MESSAGE:
					eventResult = await FederationRoomEvents.addEvent(event.context, event);

					// If the event was successfully added, handle the event locally
					if (eventResult.success) {
						const { data: { roomId, messageId } } = event;

						// Remove the message
						Messages.removeById(messageId);

						// Notify the room
						Notifications.notifyRoom(roomId, 'deleteMessage', { _id: messageId });
					}
					break;

				//
				// ROOM_DELETE
				//
				case eventTypes.ROOM_DELETE:
					eventResult = await FederationRoomEvents.addEvent(event.context, event);

					// If the event was successfully added, handle the event locally
					if (eventResult.success) {
						const { data: { roomId } } = event;

						// Check if room exists
						const persistedRoom = Rooms.findOne({ _id: roomId });

						if (persistedRoom) {
							// Delete the room
							deleteRoom(roomId);
						}

						// Remove all room events
						await FederationRoomEvents.removeRoomEvents(roomId);
					}
					break;

				//
				// Could not find event
				//
				default:
					continue;
			}

			// If there was an error handling the event, take action
			if (!eventResult.success) {
				logger.server.debug(`federation.events.dispatch => Event has missing parents -> event=${ JSON.stringify(event, null, 2) }`);

				Federation.client.requestEventsFromLatest(event.origin, Federation.domain, contextDefinitions.defineType(event), event.context, eventResult.latestEventIds);

				// And stop handling the events
				break;
			}

			/* eslint-enable no-await-in-loop */
		}

		// Respond
		return API.v1.success();
	},
});
