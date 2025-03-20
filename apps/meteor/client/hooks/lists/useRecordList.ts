import { useEffect, useState } from 'react';

import type { AsyncStatePhase } from '../../lib/asyncState';
import type { RecordList } from '../../lib/lists/RecordList';

type RecordListValue<T> = {
	phase: AsyncStatePhase;
	items: T[];
	itemCount: number;
	error: Error | undefined;
};

export const useRecordList = <T extends { _id: string; _updatedAt?: Date }>(recordList: RecordList<T>): RecordListValue<T> => {
	const [state, setState] = useState<RecordListValue<T>>(() => ({
		phase: recordList.phase,
		items: recordList.items,
		itemCount: recordList.itemCount,
		error: undefined,
	}));

	useEffect(() => {
		const disconnectMutatingEvent = recordList.on('mutating', () => {
			setState(() => ({
				phase: recordList.phase,
				items: recordList.items,
				itemCount: recordList.itemCount,
				error: undefined,
			}));
		});

		const disconnectMutatedEvent = recordList.on('mutated', () => {
			setState((prevState) => ({
				phase: recordList.phase,
				items: recordList.items,
				itemCount: recordList.itemCount,
				error: prevState.error,
			}));
		});

		const disconnectClearedEvent = recordList.on('cleared', () => {
			setState(() => ({
				phase: recordList.phase,
				items: recordList.items,
				itemCount: recordList.itemCount,
				error: undefined,
			}));
		});

		const disconnectErroredEvent = recordList.on('errored', (error) => {
			setState((state) => ({ ...state, error }));
		});

		return (): void => {
			disconnectMutatingEvent();
			disconnectMutatedEvent();
			disconnectClearedEvent();
			disconnectErroredEvent();
		};
	}, [recordList]);

	return state;
};
