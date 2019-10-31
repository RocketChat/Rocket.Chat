import { SHA256 } from 'meteor/sha';

import { Base } from './_Base';

export const eventTypes = {
	// Global
	GENESIS: 'genesis',
	PING: 'ping',

	// Room
	ROOM_MESSAGE: 'msg',
	ROOM_EDIT_MESSAGE: 'emsg',

	ROOM_DELETE: 'room_delete',
	ROOM_ADD_USER: 'room_add_user',
	ROOM_REMOVE_USER: 'room_remove_user',
	ROOM_DELETE_MESSAGE: 'room_delete_message',
	ROOM_SET_MESSAGE_REACTION: 'room_set_message_reaction',
	ROOM_UNSET_MESSAGE_REACTION: 'room_unset_message_reaction',
	ROOM_MUTE_USER: 'room_mute_user',
	ROOM_UNMUTE_USER: 'room_unmute_user',
};

export const contextDefinitions = {
	ROOM: {
		t: 'room',
		isRoom(event) {
			return !!event.rid;
		},
		context(event) {
			const { rid } = event;

			return rid;
		},
		contextQuery(rid) {
			return { rid };
		},
	},

	defineType(event) {
		if (this.ROOM.isRoom(event)) {
			return this.ROOM.t;
		}

		return 'undefined';
	},
};

export class EventsModel extends Base {
	constructor(nameOrModel) {
		super(nameOrModel);

		this.tryEnsureIndex({ hasChildren: 1 }, { sparse: true });
		this.tryEnsureIndex({ ts: 1 });
	}

	getEventHash(contextQuery, event) {
		return SHA256(`${ event.src }${ JSON.stringify(contextQuery) }${ event._pids.join(',') }${ event.t }${ event.ts }${ JSON.stringify(event.d) }`);
	}

	async createEvent(src, contextQuery, { _cid, t, d }) {
		let _pids = []; // Previous ids

		// If it is not a GENESIS event, we need to get the previous events
		if (t !== eventTypes.GENESIS) {
			const previousEvents = await this.model
				.rawCollection()
				.find({ ...contextQuery, hasChildren: false })
				.toArray();

			_pids = previousEvents.map((e) => e._id);
		}

		const event = {
			_cid,
			_pids: _pids || [],
			v: 2,
			ts: new Date(),
			src,
			...contextQuery,
			t,
			d,
			hasChildren: false,
		};

		event._id = this.getEventHash(contextQuery, event);

		return event;
	}

	async createGenesisEvent(src, contextQuery, { d }) {
		// Check if genesis event already exists, if so, do not create
		const genesisEvent = await this.model
			.rawCollection()
			.findOne({ ...contextQuery, t: eventTypes.GENESIS });

		if (genesisEvent) {
			throw new Error(`A GENESIS event for this context query already exists: ${ JSON.stringify(contextQuery, null, 2) }`);
		}

		return this.createEvent(src, contextQuery, { t: eventTypes.GENESIS, d });
	}

	async addEvent(contextQuery, event) {
		// Check if the event does not exit
		const existingEvent = this.findOne({ _id: event._id });

		// If it does not, we insert it, checking for the parents
		if (!existingEvent) {
			// Check if we have the parents
			const parents = await this.model.rawCollection().find({ ...contextQuery, _id: { $in: event._pids } }, { _id: 1 }).toArray();
			const _pids = parents.map(({ _id }) => _id);

			// This means that we do not have the parents of the event we are adding
			if (_pids.length !== event._pids.length) {
				const { src } = event;

				// Get the latest events for that context and src
				const latestEvents = await this.model.rawCollection().find({ ...contextQuery, src }, { _id: 1 }).toArray();
				const latestEventIds = latestEvents.map(({ _id }) => _id);

				return {
					success: false,
					reason: 'missingParents',
					missingParentIds: event._pids.filter(({ _id }) => _pids.indexOf(_id) === -1),
					latestEventIds,
				};
			}

			// Clear the "hasChildren" of the parent events
			await this.update({ _id: { $in: _pids } }, { $unset: { hasChildren: '' } }, { multi: 1 });

			this.insert(event);
		}

		return {
			success: true,
		};
	}

	async updateEventData(contextQuery, event) {
		const existingEvent = await this.model
			.rawCollection()
			.findOne({ ...contextQuery, _cid: event._cid });

		const updateQuery = {};

		if (event.d.set) {
			updateQuery.$set = {};

			for (const k of Object.keys(event.d.set)) {
				updateQuery.$set[`d.${ k }`] = event.d.set[k];
			}
		}

		if (event.d.unset) {
			updateQuery.$unset = {};

			for (const k of Object.keys(event.d.unset)) {
				updateQuery.$unset[`d.${ k }`] = event.d.unset[k];
			}
		}

		if (!event.d.set && !event.d.unset) {
			updateQuery.$set = {};

			updateQuery.$set.d = event.d;
		}

		// If there is no _d (original data), create it
		if (!existingEvent._d) {
			updateQuery.$set._d = existingEvent.d;
		}

		await this.model.rawCollection().update({ _id: existingEvent._id }, updateQuery);
	}

	async getEventById(contextQuery, eventId) {
		const event = await this.model
			.rawCollection()
			.findOne({ ...contextQuery, _id: eventId });

		return {
			success: !!event,
			event,
		};
	}

	async getLatestEvents(contextQuery, fromTimestamp) {
		return this.model.rawCollection().find({ ...contextQuery, ts: { $gt: new Date(fromTimestamp) } }).toArray();
	}

	async removeContextEvents(contextQuery) {
		return this.model.rawCollection().remove({ ...contextQuery });
	}
}
