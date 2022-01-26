import { Cursor, FilterQuery, InsertOneWriteOpResult } from 'mongodb';

import { BaseRaw, IndexSpecification } from './BaseRaw';
import { IQueueCountData, IVoipEvent, IVoipEvent as T } from '../../../../definition/voip/IVoipEvent';
import { Logger } from '../../../../server/lib/logger/Logger';

const logger: Logger = new Logger('VoipEventsRaw');

export class VoipEventsRaw extends BaseRaw<T> {
	protected indexes: IndexSpecification[] = [
		{ key: { event: 1 }, sparse: false },
		{ key: { objectname: 1 }, sparse: true },
	];

	async addVoipEvent(event: string, objectname: string, eventdata: IQueueCountData): Promise<InsertOneWriteOpResult<T>> {
		logger.error({ msg: 'ROCKETCHAT_DEBUG_addVoipEvent', eventdata });
		return this.insertOne({
			event,
			objectname,
			eventdata,
		});
	}

	// db.foo.find().sort({_id:1}).limit(50);
	async findLatest(event: string, objectname: string, fields?: any): Promise<Cursor<IVoipEvent | null>> {
		let options = {};
		if (fields) {
			options = {
				fields,
			};
		}
		const query: FilterQuery<T> = {
			event,
			objectname,
		};
		return this.find(query, options).sort({ _updatedAt: -1 }).limit(1);
	}

	async findEventIfExists(event: string, objectname: string, fields?: any): Promise<IVoipEvent | null> {
		let options = {};
		if (fields) {
			options = {
				fields,
			};
		}
		const query: FilterQuery<T> = {
			event,
			objectname,
		};
		return this.findOne(query, options);
	}

	async updateEventData(event: string, data: any): Promise<any> {
		const query = { event };

		const update = {
			$set: {
				...data,
			},
		};
		return this.update(query, update);
	}
}
