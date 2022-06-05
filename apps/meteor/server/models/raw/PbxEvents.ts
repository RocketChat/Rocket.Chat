import type { Cursor, IndexSpecification } from 'mongodb';
import type { IPbxEvent } from '@rocket.chat/core-typings';
import type { IPbxEventsModel } from '@rocket.chat/model-typings';

import { ModelClass } from './ModelClass';

export class PbxEventsRaw extends ModelClass<IPbxEvent> implements IPbxEventsModel {
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
