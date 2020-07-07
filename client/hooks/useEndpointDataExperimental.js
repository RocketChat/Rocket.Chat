import { useEffect, useState } from 'react';

import { useEndpoint } from '../contexts/ServerContext';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';

export const ENDPOINT_STATES = {
	LOADING: 'LOADING',
	DONE: 'DONE',
	ERROR: 'ERROR',
};

const defaultState = { data: null, state: ENDPOINT_STATES.LOADING };

export const useEndpointDataExperimental = (endpoint, params = {}, { delayTimeout = 1000 } = {}) => {
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

				setData({ delaying: true, state: ENDPOINT_STATES.LOADING, reload: fetchData });
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

				setData({ error, state: ENDPOINT_STATES.ERROR, reload: fetchData });
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				clearTimeout(timer);
			}
		};

		fetchData();

		return () => {
			mounted = false;
		};
	}, [delayTimeout, dispatchToastMessage, getData, params]);

	return data;
};
