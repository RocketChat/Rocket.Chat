import _ from 'lodash';
import { SHA256 } from 'meteor/sha';
import deepMapKeys from 'deep-map-keys';
import { EJSON } from 'meteor/ejson';

import { IEDataRoom } from '../../../events/definitions/data/IEDataRoom';
import { IEDataUpdate } from '../../../events/definitions/data/IEDataUpdate';
import { EventContext, EventTypeDescriptor, EDataDefinition, IEData, IEvent } from '../../../events/definitions/IEvent';
import { Base } from './_Base';

export declare interface IContextQuery { ct: EventContext; cid: string }
export declare interface IAddEventResult { success: boolean; reason?: string; missingParentIds?: Array<string>; latestEventIds?: Array<string> }
export declare interface IEventStub<T extends EDataDefinition> { _cid?: string; t: EventTypeDescriptor; d: T }

export declare type IEventDataHashOption = {
	include?: Array<string>;
	skip?: Array<string>;
}
export declare type IEventDataHashOptions = {
	[key in EventTypeDescriptor]?: IEventDataHashOption;
}
export declare type IEventDataHashOptionsDef = {
	t: Array<EventTypeDescriptor>;
	options: IEventDataHashOption;
};

export class EventsModel extends Base<IEvent<EDataDefinition>> {
	readonly dataHashOptionsDefinition: Array<IEventDataHashOptionsDef> = [
		{
			t: [EventTypeDescriptor.MESSAGE, EventTypeDescriptor.EDIT_MESSAGE],
			options: {
				include: ['t', 'u', 'msg'],
			},
		},
	];

	readonly dataHashOptions: IEventDataHashOptions;

	constructor(nameOrModel: string) {
		super(nameOrModel);

		this.tryEnsureIndex({ ct: 1 });
		this.tryEnsureIndex({ ct: 1, cid: 1 });
		this.tryEnsureIndex({ ct: 1, cid: 1, ts: 1 });
		this.tryEnsureIndex({ ts: 1 });
		this.tryEnsureIndex({ isLeaf: 1 }, { sparse: true });

		this.dataHashOptions = this.dataHashOptionsDefinition.reduce((acc, item) => {
			for (const t of item.t) {
				acc[t] = item.options;
			}

			return acc;
		}, {} as IEventDataHashOptions);
	}

	public getEventIdHash<T extends EDataDefinition>(contextQuery: IContextQuery, event: IEvent<T>): string {
		return SHA256(`${ event.src }${ JSON.stringify(contextQuery) }${ event._pids.join(',') }${ event.t }${ event.ts }${ event.dHash }`);
	}

	public getEventDataHash<T extends EDataDefinition>(event: IEvent<T>): string {
		let data: any = event.d;

		const options: any = this.dataHashOptions[event.t];

		if (options) {
			if (options.include) { data = _.pick(data, options.include); }
			if (options.skip) { data = _.omit(data, options.skip); }
		}

		return SHA256(JSON.stringify(data));
	}

	public async createEvent<T extends EDataDefinition>(src: string, contextQuery: IContextQuery, stub: IEventStub<T>): Promise<IEvent<T>> {
		let _pids = []; // Previous ids

		// If it is not a GENESIS event, we need to get the previous events
		if (stub.t !== EventTypeDescriptor.ROOM) {
			const previousEvents = await this.model
				.rawCollection()
				.find({ ...contextQuery, isLeaf: true })
				.toArray();

			_pids = previousEvents.map((e: IEvent<any>) => e._id);

			if (_pids.length === 0) {
				throw new Error(`The event type:${ stub.t } cannot have zero parents, something went wrong`);
			}
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
			dHash: '',
			d: stub.d,
			isLeaf: true,
		};

		//
		// Create the data hash
		event.dHash = this.getEventDataHash(event);

		//
		// Create ID hash
		event._id = this.getEventIdHash(contextQuery, event);

		return event;
	}

	public async createGenesisEvent(src: string, contextQuery: IContextQuery, d: IEDataRoom): Promise<IEvent<IEDataRoom>> {
		// Check if genesis event already exists, if so, do not create
		const genesisEvent = await this.model
			.rawCollection()
			.findOne({ ...contextQuery, t: EventTypeDescriptor.ROOM });

		if (genesisEvent) {
			throw new Error(`A GENESIS event for this context query already exists: ${ JSON.stringify(contextQuery, null, 2) }`);
		}

		const stub: IEventStub<IEDataRoom> = {
			t: EventTypeDescriptor.ROOM,
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

			// Clear the "isLeaf" of the parent events
			await this.update({ _id: { $in: _pids } }, { $unset: { isLeaf: 1 } }, { multi: 1 });

			this.insert(event);
		}

		return {
			success: true,
		};
	}

	private async getExistingEvent(contextQuery: IContextQuery, eventT: string, eventCID?: string): Promise<IEvent<any>> {
		const query: any = { ...contextQuery, t: eventT.substr(1) };

		if (eventCID) {
			query._cid = eventCID;
		}

		return this.model.rawCollection().findOne(query);
	}

	public async updateEventData<T extends IEData>(contextQuery: IContextQuery, eventT: string, updateData: IEDataUpdate<T>, eventCID?: string): Promise<void> {
		const existingEvent = await this.getExistingEvent(contextQuery, eventT, eventCID);

		const updateQuery: any = EJSON.fromJSONValue(deepMapKeys(updateData, (k: any) => k.replace('[csg]', '$').replace('[dot]', '.')));

		for (const prop in updateQuery) {
			if (prop.startsWith('$')) {
				updateQuery[prop] = _.mapKeys(updateQuery[prop], (_value: any, key: any) => (key.startsWith('$') ? key : `d.${ key }`));
			}
		}

		await this.model.rawCollection().update({ _id: existingEvent._id }, updateQuery);
	}

	public async flagEventAsDeleted(contextQuery: IContextQuery, eventT: string, deletedAt: Date, eventCID?: string): Promise<void> {
		const existingEvent = await this.getExistingEvent(contextQuery, eventT, eventCID);

		await this.model.rawCollection().update({ _id: existingEvent._id }, {
			$set: {
				_deletedAt: deletedAt,
			},
		});
	}
}
