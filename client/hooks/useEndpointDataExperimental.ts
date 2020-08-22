import { useEffect, useState } from 'react';

import { useEndpoint } from '../contexts/ServerContext';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';

export enum ENDPOINT_STATES {
	LOADING = 'LOADING',
	DONE = 'DONE',
	ERROR = 'ERROR',
}

type EndpointState<T> = {
	data: T | null;
	state: ENDPOINT_STATES;
	error?: Error;
	delaying?: boolean;
	reload?: () => Promise<void>;
};

type EndpointOptions = {
	delayTimeout?: number;
};

const defaultState: EndpointState<any> = { data: null, state: ENDPOINT_STATES.LOADING };
const defaultParams: Record<string, unknown> = {};
const defaultOptions: EndpointOptions = {};

export const useEndpointDataExperimental = <T>(
	endpoint: string,
	params = defaultParams,
	{ delayTimeout = 1000 } = defaultOptions,
): EndpointState<T> => {
	const [data, setData] = useState<EndpointState<T>>(defaultState);

	const getData = useEndpoint('GET', endpoint);
	const dispatchToastMessage = useToastMessageDispatch();

	useEffect(() => {
		let mounted = true;

		const fetchData = async (): Promise<void> => {
			const timer = setTimeout(() => {
				if (!mounted) {
					return;
				}

				setData({ data: null, delaying: true, state: ENDPOINT_STATES.LOADING, reload: fetchData });
			}, delayTimeout);

			try {
				setData(defaultState);
				const data = await getData(params);

				if (!mounted) {
					return;
				}

				if (!data.success) {
					throw new Error(data.status);
				}


				setData({ data, state: ENDPOINT_STATES.DONE, reload: fetchData });
			} catch (error) {
				if (!mounted) {
					return;
				}

				setData({ data: null, error, state: ENDPOINT_STATES.ERROR, reload: fetchData });
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				clearTimeout(timer);
			}
		};

		fetchData();

		return (): void => {
			mounted = false;
		};
	}, [delayTimeout, dispatchToastMessage, getData, params]);

	return data;
};
