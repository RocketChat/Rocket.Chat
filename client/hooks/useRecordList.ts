import { useEffect } from 'react';

import { AsyncState } from '../lib/asyncState';
import { RecordList } from '../lib/lists/RecordList';
import { useAsyncState } from './useAsyncState';
import { IRocketChatRecord } from '../../definition/IRocketChatRecord';

export const useRecordList = <T extends IRocketChatRecord>(recordList: RecordList<T>): AsyncState<T[]> => {
	const { update, resolve, reject, reset, ...state } = useAsyncState<T[]>();

	useEffect(() => {
		const disconnectMutatingEvent = recordList.on('mutating', () => {
			update();
		});

		const disconnectMutatedEvent = recordList.on('mutated', (_hasChanged: boolean | undefined) => {
			resolve(recordList.items());
		});

		const disconnectClearedEvent = recordList.on('cleared', () => {
			reset();
		});

		const disconnectErroredEvent = recordList.on('errored', (error: Error | undefined) => {
			if (!error) {
				reject(new Error('undefined error'));
				return;
			}

			reject(error);
		});

		return (): void => {
			disconnectMutatingEvent();
			disconnectMutatedEvent();
			disconnectClearedEvent();
			disconnectErroredEvent();
		};
	}, [recordList, update, reset, resolve, reject]);

	return state;
};
