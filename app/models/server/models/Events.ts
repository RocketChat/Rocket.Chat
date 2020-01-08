import { SHA256 } from 'meteor/sha';

import { IEDataGenesis } from '../../../events/definitions/data/IEDataGenesis';
import { IEDataUpdate } from '../../../events/definitions/data/IEDataUpdate';
import { EDataDefinition, IEvent, EventTypeDescriptor } from '../../../events/definitions/IEvent';
import { Base } from './_Base';

export declare interface IContextQuery { rid: string }
export declare interface IAddEventResult { success: boolean; reason?: string; missingParentIds?: Array<string>; latestEventIds?: Array<string> }
export declare interface IEventStub<T extends EDataDefinition> { _cid?: string; t: EventTypeDescriptor; d?: T }

function renameObjectKeys(object: any): any {
	const build: any = {};
	let value: any;

	for (const key in object) {
		const destinationKey = key.startsWith('_$') ? key.substr(1) : key;
		value = object[key];
		build[destinationKey] = value;
		if (typeof value === 'object' && !Array.isArray(value)) {
			build[destinationKey] = Object.keys(value).reduce((acc, k) => {
				acc[`d.${k}`] = value[k];
				return acc;
			}, {} as any);
			value = renameObjectKeys(value);
		} else {
			
		}
	}
	return build;
}

export class EventsModel extends Base {
	constructor(nameOrModel: string) {
		super(nameOrModel);

		this.tryEnsureIndex({ hasChildren: 1 }, { sparse: true });
		this.tryEnsureIndex({ ts: 1 });
	}

	public getEventHash<T extends EDataDefinition>(contextQuery: IContextQuery, event: IEvent<T>): string {
		return SHA256(`${ event.src }${ JSON.stringify(contextQuery) }${ event._pids.join(',') }${ event.t }${ event.ts }${ JSON.stringify(event.d) }`);
	}

	public async createEvent<T extends EDataDefinition>(src: string, contextQuery: IContextQuery, stub: IEventStub<T>): Promise<IEvent<T>> {
		let _pids = []; // Previous ids

		// If it is not a GENESIS event, we need to get the previous events
		if (stub.t !== EventTypeDescriptor.GENESIS) {
			const previousEvents = await this.model
				.rawCollection()
				.find({ ...contextQuery, hasChildren: false })
				.toArray();

			_pids = previousEvents.map((e: IEvent<any>) => e._id);
		}

		const event: IEvent<T> = {
			_id: '',
			_cid: stub._cid,
			_pids: _pids || [],
			v: 2,
			ts: new Date(),
			src,
			...contextQuery,
			t: stub.t,
			d: stub.d,
			hasChildren: false,
		};

		event._id = this.getEventHash(contextQuery, event);

		return event;
	}

	public async createGenesisEvent(src: string, contextQuery: IContextQuery, d: IEDataGenesis): Promise<IEvent<IEDataGenesis>> {
		// Check if genesis event already exists, if so, do not create
		const genesisEvent = await this.model
			.rawCollection()
			.findOne({ ...contextQuery, t: EventTypeDescriptor.GENESIS });

		if (genesisEvent) {
			throw new Error(`A GENESIS event for this context query already exists: ${ JSON.stringify(contextQuery, null, 2) }`);
		}

		const stub: IEventStub<IEDataGenesis> = {
			t: EventTypeDescriptor.GENESIS,
			d,
		};

		return this.createEvent(src, contextQuery, stub);
	}

	public async addEvent<T extends EDataDefinition>(contextQuery: IContextQuery, event: IEvent<T>): Promise<IAddEventResult> {
		// Check if the event does not exit
		const existingEvent = this.findOne({ _id: event._id });

		// If it does not, we insert it, checking for the parents
		if (!existingEvent) {
			// Check if we have the parents
			const parents: Array<IEvent<any>> = await this.model.rawCollection().find({ ...contextQuery, _id: { $in: event._pids } }, { _id: 1 }).toArray();
			const _pids: Array<string> = parents.map((e: IEvent<any>) => e._id);

			// This means that we do not have the parents of the event we are adding
			if (_pids.length !== event._pids.length) {
				const { src } = event;

				// Get the latest events for that context and src
				const latestEvents = await this.model.rawCollection().find({ ...contextQuery, src }, { _id: 1 }).toArray();
				const latestEventIds = latestEvents.map((e: IEvent<any>) => e._id);

				return {
					success: false,
					reason: 'missingParents',
					missingParentIds: event._pids.filter((_id) => _pids.indexOf(_id) === -1),
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

	public async updateEventData<T extends EDataDefinition>(contextQuery: IContextQuery, eventCID: string, updateData: IEDataUpdate<T>): Promise<void> {
		const existingEvent = await this.model
			.rawCollection()
			.findOne({ ...contextQuery, _cid: eventCID });

		const updateQuery: any = {};

		

		// for (let prop in updateData) {
		// 	if (!prop.startsWith('_$')) {
		// 		updateQuery[prop] = updateData[prop];
		// 		continue;
		// 	}

		// 	const data:any = updateData[prop];

		// 	updateQuery[prop.substr(1)] = Object.keys(data).reduce((acc, k) => {
		// 		acc[`d.${k}`] = data[k];
		// 		return acc;
		// 	}, {} as any);
		// }
		console.log(updateData)
		console.log(updateQuery)
		console.log(renameObjectKeys(updateData))

		// if (updateData.set) {
		// 	updateQuery.$set = {};

		// 	for (const [k, v] of Object.entries(updateData.set)) {
		// 		updateQuery.$set[`d.${ k }`] = v;
		// 	}
		// }

		// if (updateData.unset) {
		// 	updateQuery.$unset = {};

		// 	for (const [k, v] of Object.entries(updateData.unset)) {
		// 		updateQuery.$unset[`d.${ k }`] = v;
		// 	}
		// }

		// If there is no _d (original data), create it
		if (!existingEvent._d) {
			updateQuery.$set._d = existingEvent.d;
		}

		await this.model.rawCollection().update({ _id: existingEvent._id }, updateQuery);
	}

	// async getEventById(contextQuery: ContextQuery, eventId:string) {
	// 	const event = await this.model
	// 		.rawCollection()
	// 		.findOne({ ...contextQuery, _id: eventId });

	// 	return {
	// 		success: !!event,
	// 		event,
	// 	};
	// }

	// async getLatestEvents(contextQuery: ContextQuery, fromTimestamp: Date) {
	// 	return this.model.rawCollection().find({ ...contextQuery, ts: { $gt: fromTimestamp } }).toArray();
	// }

	// async removeContextEvents(contextQuery: ContextQuery) {
	// 	return this.model.rawCollection().remove({ ...contextQuery });
	// }
}
