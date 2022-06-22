import type { IPbxEvent, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IPbxEventsModel } from '@rocket.chat/model-typings';
import type { Collection, Cursor, Db, IndexSpecification } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class PbxEventsRaw extends BaseRaw<IPbxEvent> implements IPbxEventsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IPbxEvent>>) {
		super(db, 'pbx_events', trash);
	}

	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { uniqueId: 1 }, unique: true }];
	}

	findByEvents(callUniqueId: string, events: string[]): Cursor<IPbxEvent> {
		return this.find(
			{
				$or: [
					{
						callUniqueId,
					},
					{
						callUniqueIdFallback: callUniqueId,
					},
				],
				event: {
					$in: events,
				},
			},
			{
				sort: {
					ts: 1,
				},
			},
		);
	}

	findOneByEvent(callUniqueId: string, event: string): Promise<IPbxEvent | null> {
		return this.findOne({
			$or: [
				{
					callUniqueId,
				},
				{
					callUniqueIdFallback: callUniqueId,
				},
			],
			event,
		});
	}

	findOneByUniqueId(callUniqueId: string): Promise<IPbxEvent | null> {
		return this.findOne({
			$or: [
				{
					callUniqueId,
				},
				{
					callUniqueIdFallback: callUniqueId,
				},
			],
		});
	}
}
