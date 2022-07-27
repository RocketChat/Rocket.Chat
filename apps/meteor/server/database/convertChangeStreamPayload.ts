import type { IRocketChatRecord } from '@rocket.chat/core-typings';
import type { ChangeStreamDeleteDocument, ChangeStreamInsertDocument, ChangeStreamUpdateDocument } from 'mongodb';

import type { RealTimeData } from './DatabaseWatcher';

export function convertChangeStreamPayload(
	event:
		| ChangeStreamInsertDocument<IRocketChatRecord>
		| ChangeStreamUpdateDocument<IRocketChatRecord>
		| ChangeStreamDeleteDocument<IRocketChatRecord>,
): RealTimeData<IRocketChatRecord> | void {
	switch (event.operationType) {
		case 'insert':
			return {
				action: 'insert',
				clientAction: 'inserted',
				id: event.documentKey._id,
				data: event.fullDocument,
			};
		case 'update':
			const diff: Record<string, any> = {
				...event.updateDescription.updatedFields,
				...(event.updateDescription.removedFields || []).reduce((unset, removedField) => {
					return {
						...unset,
						[removedField]: undefined,
					};
				}, {}),
			};

			const unset: Record<string, number> = (event.updateDescription.removedFields || []).reduce((unset, removedField) => {
				return {
					...unset,
					[removedField]: 1,
				};
			}, {});

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
