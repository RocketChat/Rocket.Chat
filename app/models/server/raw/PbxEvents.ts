import { Cursor } from 'mongodb';

import { BaseRaw, IndexSpecification } from './BaseRaw';
import { IPbxEvent } from '../../../../definition/IPbxEvent';

export class PbxEventsRaw extends BaseRaw<IPbxEvent> {
	protected indexes: IndexSpecification[] = [{ key: { uniqueId: 1 }, unique: true }];

	findByEvents(callUniqueId: string, events: string[]): Cursor<IPbxEvent> {
		return this.find(
			{
				callUniqueId,
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
}
