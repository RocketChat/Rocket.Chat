import { useState, useEffect } from 'react';

import { useEndpoint } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';

type SeatsData = {
	members: number;
	limit: number;
};

export const useSeatsData = (): SeatsData => {
	const [data, setData] = useState<SeatsData>({
		members: 0,
		limit: 0,
	});
	const getStatistics = useEndpoint('GET', 'statistics');
	const getLicenseData = useEndpoint('GET', 'licenses.get');

	const dispatchToast = useToastMessageDispatch();

	useEffect((): any => {
		let discard = false;
		const fetch = async (): Promise<void> => {
			try {
				const stats = await getStatistics();
				const { licenses } = await getLicenseData();

				console.log({ stats, licenses });
				if (discard) {
					return;
				}
				if (!licenses || !licenses.length) {
					return;
				}
				setData({
					members: stats.activeUsers || 0,
					limit: licenses[0].maxActiveUsers || 0,
				});
			} catch (error) {
				dispatchToast({ type: 'error', message: error });
			}
		};

		fetch();
		return (): void => {
			discard = true;
		};
	}, [getStatistics, getLicenseData, dispatchToast]);

	return data;
};
