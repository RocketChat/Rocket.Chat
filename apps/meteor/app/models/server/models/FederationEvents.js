import { SHA256 } from 'meteor/sha';

import { Base } from './_Base';

export const eventTypes = {
	// Global
	GENESIS: 'genesis',
	PING: 'ping',

	// Room
	ROOM_DELETE: 'room_delete',
	ROOM_ADD_USER: 'room_add_user',
	ROOM_REMOVE_USER: 'room_remove_user',
	ROOM_USER_LEFT: 'room_user_left',
	ROOM_MESSAGE: 'room_message',
	ROOM_EDIT_MESSAGE: 'room_edit_message',
	ROOM_DELETE_MESSAGE: 'room_delete_message',
	ROOM_SET_MESSAGE_REACTION: 'room_set_message_reaction',
	ROOM_UNSET_MESSAGE_REACTION: 'room_unset_message_reaction',
	ROOM_MUTE_USER: 'room_mute_user',
	ROOM_UNMUTE_USER: 'room_unmute_user',
};

export const contextDefinitions = {
	ROOM: {
		type: 'room',
		isRoom(event) {
			return !!event.context.roomId;
		},
		contextQuery(roomId) {
			return { roomId };
		},
	},

	defineType(event) {
		if (this.ROOM.isRoom(event)) {
			return this.ROOM.type;
		}

		return 'undefined';
	},
};

export class FederationEventsModel extends Base {
	constructor(nameOrModel) {
		super(nameOrModel);

		this.tryEnsureIndex({ hasChildren: 1 }, { sparse: true });
		this.tryEnsureIndex({ timestamp: 1 });
	}

	getEventHash(contextQuery, event) {
		return SHA256(
			`${event.origin}${JSON.stringify(contextQuery)}${event.parentIds.join(',')}${event.type}${event.timestamp}${JSON.stringify(
				event.data,
			)}`,
		);
	}

	async createEvent(origin, contextQuery, type, data) {
		let previousEventsIds = [];

		// If it is not a GENESIS event, we need to get the previous events
		if (type !== eventTypes.GENESIS) {
			const previousEvents = await this.model.rawCollection().find({ context: contextQuery, hasChildren: false }).toArray();

			// if (!previousEvents.length) {
			// 	throw new Error('Could not create event, the context does not exist');
			// }

			previousEventsIds = previousEvents.map((e) => e._id);
		}

		const event = {
			origin,
			context: contextQuery,
			parentIds: previousEventsIds || [],
			type,
			timestamp: new Date(),
			data,
			hasChildren: false,
		};

		event._id = this.getEventHash(contextQuery, event);

		// this.insert(event);

		// Clear the "hasChildren" of those events
		await this.update({ _id: { $in: previousEventsIds } }, { $unset: { hasChildren: '' } }, { multi: 1 });

		return event;
	}

	async createGenesisEvent(origin, contextQuery, data) {
		// Check if genesis event already exists, if so, do not create
		const genesisEvent = await this.model.rawCollection().findOne({ context: contextQuery, type: eventTypes.GENESIS });

		if (genesisEvent) {
			throw new Error(`A GENESIS event for this context query already exists: ${JSON.stringify(contextQuery, null, 2)}`);
		}

		return this.createEvent(origin, contextQuery, eventTypes.GENESIS, data);
	}

	async addEvent(contextQuery, event) {
		// Check if the event does not exit
		const existingEvent = this.findOne({ _id: event._id });

		// If it does not, we insert it, checking for the parents
		if (!existingEvent) {
			// Check if we have the parents
			const parents = await this.model
				.rawCollection()
				.find({ context: contextQuery, _id: { $in: event.parentIds } }, { _id: 1 })
				.toArray();
			const parentIds = parents.map(({ _id }) => _id);

			// This means that we do not have the parents of the event we are adding
			if (parentIds.length !== event.parentIds.length) {
				const { origin } = event;

				// Get the latest events for that context and origin
				const latestEvents = await this.model.rawCollection().find({ context: contextQuery, origin }, { _id: 1 }).toArray();
				const latestEventIds = latestEvents.map(({ _id }) => _id);

				return {
					success: false,
					reason: 'missingParents',
					missingParentIds: event.parentIds.filter(({ _id }) => parentIds.indexOf(_id) === -1),
					latestEventIds,
				};
			}

			// Clear the "hasChildren" of the parent events
			await this.update({ _id: { $in: parentIds } }, { $unset: { hasChildren: '' } }, { multi: 1 });

			this.insert(event);
		}

		return {
			success: true,
		};
	}

	async getEventById(contextQuery, eventId) {
		const event = await this.model.rawCollection().findOne({ context: contextQuery, _id: eventId });

		return {
			success: !!event,
			event,
		};
	}

	async getLatestEvents(contextQuery, fromTimestamp) {
		return this.model
			.rawCollection()
			.find({ context: contextQuery, timestamp: { $gt: new Date(fromTimestamp) } })
			.toArray();
	}

	async removeContextEvents(contextQuery) {
		return this.model.rawCollection().remove({ context: contextQuery });
	}
}
