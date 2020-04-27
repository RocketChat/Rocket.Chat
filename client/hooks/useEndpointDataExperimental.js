import { useEffect, useState } from 'react';

import { useEndpoint } from '../contexts/ServerContext';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';

export const ENDPOINT_STATES = {
	LOADING: 'LOADING',
	DELAYING: 'DELAYING',
	DONE: 'DONE',
	ERROR: 'ERROR',
};

const defaultState = { data: null, state: ENDPOINT_STATES.LOADING };

export const useEndpointDataExperimental = (endpoint, params = {}) => {
	const [data, setData] = useState(defaultState);

	const getData = useEndpoint('GET', endpoint);
	const dispatchToastMessage = useToastMessageDispatch();

	useEffect(() => {
		let mounted = true;

		const fetchData = async () => {
			const timer = setTimeout(() => {
				if (!mounted) {
					return;
				}

				setData({ state: ENDPOINT_STATES.DELAYING });
			}, 1000);

			try {
				setData(defaultState);
				const data = await getData(params);

				if (!data.success) {
					throw new Error(data.status);
				}

				if (!mounted) {
					return;
				}

				setData({ data, state: ENDPOINT_STATES.DONE });
			} catch (error) {
				setData({ error, state: ENDPOINT_STATES.ERROR });
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				clearTimeout(timer);
			}
		};

		fetchData();

		return () => {
			mounted = false;
		};
	}, [getData, params]);

	return data;
};
