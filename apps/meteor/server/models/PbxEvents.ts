import type { Cursor, IndexSpecification } from 'mongodb';
import type { IPbxEvent } from '@rocket.chat/core-typings';
import type { IPbxEventsModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { ModelClass } from './ModelClass';
import { trashCollection } from '../database/trash';
import { db } from '../database/utils';

export class PbxEvents extends ModelClass<IPbxEvent> implements IPbxEventsModel {
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

const col = db.collection('pbx_events');
registerModel('IPbxEventsModel', new PbxEvents(col, trashCollection) as IPbxEventsModel);
