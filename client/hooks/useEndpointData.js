import { useEffect, useState } from 'react';

import { useEndpoint } from '../contexts/ServerContext';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';

export const useEndpointData = (endpoint, params = {}) => {
	const [data, setData] = useState(null);

	const getData = useEndpoint('GET', endpoint);
	const dispatchToastMessage = useToastMessageDispatch();

	useEffect(() => {
		let mounted = true;

		const fetchData = async () => {
			try {
				const timer = setTimeout(() => {
					if (!mounted) {
						return;
					}

					setData(null);
				}, 3000);

				const data = await getData(params);

				clearTimeout(timer);

				if (!data.success) {
					throw new Error(data.status);
				}

				if (!mounted) {
					return;
				}

				setData(data);
			} catch (error) {
				console.error(error);
				dispatchToastMessage({ type: 'error', message: error });
			}
		};

		fetchData();

		return () => {
			mounted = false;
		};
	}, [getData, params]);

	return data;
};
