import { eventTypes } from '@rocket.chat/core-typings';
import type { IFederationEvent } from '@rocket.chat/core-typings';
import { SHA256 } from '@rocket.chat/sha256';
import type { IndexDescription, Db } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class FederationEventsModel extends BaseRaw<IFederationEvent> {
	constructor(db: Db, nameOrModel: string) {
		super(db, nameOrModel);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { hasChildren: 1 }, sparse: true }, { key: { timestamp: 1 } }];
	}

	getEventHash(
		contextQuery: { roomId: string },
		event: { type: string; timestamp: Date; data: Record<string, unknown>; parentIds: string[]; origin: string },
	): string {
		return SHA256(
			`${event.origin}${JSON.stringify(contextQuery)}${event.parentIds.join(',')}${event.type}${event.timestamp}${JSON.stringify(
				event.data,
			)}`,
		);
	}

	async createEvent(
		origin: string,
		contextQuery: { roomId: string },
		type: string,
		data: any,
	): Promise<Omit<IFederationEvent, '_updatedAt'>> {
		let previousEventsIds: string[] = [];

		// If it is not a GENESIS event, we need to get the previous events
		if (type !== eventTypes.GENESIS) {
			const previousEvents = await this.find({ context: contextQuery, hasChildren: false }).toArray();

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
			_id: '',
		};

		event._id = this.getEventHash(contextQuery, event);

		// this.insert(event);

		// Clear the "hasChildren" of those events
		await this.updateMany({ _id: { $in: previousEventsIds } }, { $unset: { hasChildren: '' } });

		return event;
	}

	async createGenesisEvent(origin: string, contextQuery: { roomId: string }, data: any): Promise<Omit<IFederationEvent, '_updatedAt'>> {
		// Check if genesis event already exists, if so, do not create
		const genesisEvent = await this.findOne({ context: contextQuery, type: eventTypes.GENESIS });

		if (genesisEvent) {
			throw new Error(`A GENESIS event for this context query already exists: ${JSON.stringify(contextQuery, null, 2)}`);
		}

		return this.createEvent(origin, contextQuery, eventTypes.GENESIS, data);
	}

	async addEvent(
		contextQuery: { roomId: string },
		event: IFederationEvent,
	): Promise<{ success: boolean; reason: string; missingParentIds: string[]; latestEventIds: string[] } | { success: boolean }> {
		// Check if the event does not exit
		const existingEvent = await this.findOne({ _id: event._id });

		// If it does not, we insert it, checking for the parents
		if (!existingEvent) {
			// Check if we have the parents
			const parents = await this.find({ context: contextQuery, _id: { $in: event.parentIds } }, { projection: { _id: 1 } }).toArray();
			const parentIds = parents.map(({ _id }) => _id);

			// This means that we do not have the parents of the event we are adding
			if (parentIds.length !== event.parentIds.length) {
				const { origin } = event;

				// Get the latest events for that context and origin
				const latestEvents = await this.find({ context: contextQuery, origin }, { projection: { _id: 1 } }).toArray();
				const latestEventIds = latestEvents.map(({ _id }) => _id);

				return {
					success: false,
					reason: 'missingParents',
					// @ts-expect-error - Is this properly typed? parentIds seems to be an string[] (and its used as a filter on an $in query)
					// but here it seems its an object of { _id: string }[] so I'm not sure if this is correct
					missingParentIds: event.parentIds.filter(({ _id }) => parentIds.indexOf(_id) === -1),
					latestEventIds,
				};
			}

			// Clear the "hasChildren" of the parent events
			await this.updateMany({ _id: { $in: parentIds } }, { $unset: { hasChildren: '' } });

			await this.insertOne(event);
		}

		return {
			success: true,
		};
	}

	async getEventById(contextQuery: { roomId: string }, eventId: string): Promise<{ success: boolean; event: IFederationEvent | null }> {
		const event = await this.findOne({ context: contextQuery, _id: eventId });

		return {
			success: !!event,
			event,
		};
	}

	async getLatestEvents(contextQuery: { roomId: string }, fromTimestamp: string): Promise<IFederationEvent[]> {
		return this.find({ context: contextQuery, timestamp: { $gt: new Date(fromTimestamp) } }).toArray();
	}

	async removeContextEvents(contextQuery: { roomId: string }) {
		return this.deleteMany({ context: contextQuery });
	}
}
