import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect } from 'react';

import { useAsyncState, AsyncState, AsyncStatePhase } from '../../../../hooks/useAsyncState';

export const useDataWithLoadMore = <T, P>(
	getData: (...args: any[]) => Promise<any>,
	params: P,
	initialValue?: T | (() => T),
): AsyncState<T> & {
	reload: () => void;
	more: (params: P) => void;
} => {
	const { resolve, reject, reset, update, ...state } = useAsyncState<T>(initialValue);
	const dispatchToastMessage = useToastMessageDispatch();

	const fetchData = useCallback(() => {
		reset();
		getData(params)
			.then(resolve)
			.catch((error) => {
				console.error(error);
				dispatchToastMessage({
					type: 'error',
					message: error,
				});
				reject(error);
			});
	}, [reset, getData, params, resolve, dispatchToastMessage, reject]);

	const more = useMutableCallback(
		(extraParams: P | ((prev: P) => P), setState: (prev: T | undefined, value: T) => T = (_prev: T | undefined, value: T): T => value) => {
			if ([AsyncStatePhase.LOADING, AsyncStatePhase.UPDATING].includes(state.phase)) {
				return;
			}
			update();
			return getData(typeof extraParams === 'function' ? (extraParams as (prev: P | undefined) => P)(params) : extraParams)
				.then((result) => resolve((prev) => setState(prev, result)))
				.catch((error) => {
					console.error(error);
					dispatchToastMessage({
						type: 'error',
						message: error,
					});
					reject(error);
				});
		},
	);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return {
		...state,
		more,
		reload: fetchData,
	};
};
