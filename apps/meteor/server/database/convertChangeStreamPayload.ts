import type { IRocketChatRecord } from '@rocket.chat/core-typings';
import type { ChangeStreamDocument } from 'mongodb';

import type { RealTimeData } from './DatabaseWatcher';

export function convertChangeStreamPayload(event: ChangeStreamDocument<IRocketChatRecord>): RealTimeData<IRocketChatRecord> | void {
	switch (event.operationType) {
		case 'insert':
			return {
				action: 'insert',
				clientAction: 'inserted',
				id: event.documentKey._id,
				data: event.fullDocument,
			};
		case 'update':
			const diff: Record<string, any> = {};

			if (event.updateDescription?.updatedFields) {
				for (const key in event.updateDescription.updatedFields) {
					if (event.updateDescription.updatedFields.hasOwnProperty(key)) {
						// TODO fix as any
						diff[key] = (event.updateDescription as any).updatedFields[key];
					}
				}
			}

			const unset: Record<string, number> = {};
			if (event.updateDescription.removedFields) {
				for (const key in event.updateDescription.removedFields) {
					if (event.updateDescription.removedFields.hasOwnProperty(key)) {
						diff[key] = undefined;
						unset[key] = 1;
					}
				}
			}

			return {
				action: 'update',
				clientAction: 'updated',
				id: event.documentKey._id,
				diff,
				unset,
			};
		case 'delete':
			return {
				action: 'remove',
				clientAction: 'removed',
				id: event.documentKey._id,
			};
	}
}
