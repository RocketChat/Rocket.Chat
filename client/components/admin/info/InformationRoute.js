import React, { useState, useEffect } from 'react';

import { useMethod } from '../../../hooks/useMethod';
import { useViewStatisticsPermission } from '../../../hooks/usePermissions';
import { useRocketChatInformation } from '../../../hooks/useRocketChatInformation';
import { useAdminSideNav } from '../hooks';
import { InformationPage } from './InformationPage';

export function InformationRoute() {
	useAdminSideNav();

	const canViewStatistics = useViewStatisticsPermission();

	const [isLoading, setLoading] = useState(true);
	const [statistics, setStatistics] = useState({});
	const [instances, setInstances] = useState([]);
	const [fetchStatistics, setFetchStatistics] = useState(() => () => ({}));
	const getStatistics = useMethod('getStatistics');
	const getInstances = useMethod('instances/get');

	useEffect(() => {
		let didCancel = false;

		const fetchStatistics = async () => {
			if (!canViewStatistics) {
				setStatistics(null);
				setInstances(null);
				return;
			}

			setLoading(true);

			try {
				const [statistics, instances] = await Promise.all([
					getStatistics(),
					getInstances(),
				]);

				if (didCancel) {
					return;
				}

				setStatistics(statistics);
				setInstances(instances);
			} finally {
				setLoading(false);
			}
		};

		setFetchStatistics(() => fetchStatistics);

		fetchStatistics();

		return () => {
			didCancel = true;
		};
	}, [canViewStatistics]);

	const info = useRocketChatInformation();

	const handleClickRefreshButton = () => {
		if (isLoading) {
			return;
		}

		fetchStatistics();
	};

	return <InformationPage
		canViewStatistics={canViewStatistics}
		isLoading={isLoading}
		info={info}
		statistics={statistics}
		instances={instances}
		onClickRefreshButton={handleClickRefreshButton}
	/>;
}
