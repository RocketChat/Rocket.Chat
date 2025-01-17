import type { IPbxEvent, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IPbxEventsModel } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class PbxEventsRaw extends BaseRaw<IPbxEvent> implements IPbxEventsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IPbxEvent>>) {
		super(db, 'pbx_events', trash, {
			collectionNameResolver(name) {
				return name;
			},
		});
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { uniqueId: 1 }, unique: true }];
	}

	findByEvents(callUniqueId: string, events: string[]): FindCursor<IPbxEvent> {
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
