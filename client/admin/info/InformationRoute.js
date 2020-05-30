import React, { useState, useEffect } from 'react';

import { usePermission } from '../../contexts/AuthorizationContext';
import { useMethod, useServerInformation, useEndpoint } from '../../contexts/ServerContext';
import { downloadJsonAsAFile } from '../../helpers/download';
import { InformationPage } from './InformationPage';

export function InformationRoute() {
	const canViewStatistics = usePermission('view-statistics');

	const [isLoading, setLoading] = useState(true);
	const [statistics, setStatistics] = useState({});
	const [instances, setInstances] = useState([]);
	const [fetchStatistics, setFetchStatistics] = useState(() => () => ({}));
	const getStatistics = useEndpoint('GET', 'statistics');
	const getInstances = useMethod('instances/get');

	useEffect(() => {
		let didCancel = false;

		const fetchStatistics = async ({ refresh = false } = {}) => {
			if (!canViewStatistics) {
				setStatistics(null);
				setInstances(null);
				return;
			}

			setLoading(true);

			try {
				const [statistics, instances] = await Promise.all([
					getStatistics({ refresh }),
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

	const info = useServerInformation();

	const handleClickRefreshButton = () => {
		if (isLoading) {
			return;
		}

		fetchStatistics({ refresh: true });
	};

	const handleClickDownloadInfo = () => {
		if (isLoading) {
			return;
		}
		downloadJsonAsAFile(statistics, 'statistics');
	};

	return <InformationPage
		canViewStatistics={canViewStatistics}
		isLoading={isLoading}
		info={info}
		statistics={statistics}
		instances={instances}
		onClickRefreshButton={handleClickRefreshButton}
		onClickDownloadInfo={handleClickDownloadInfo}
	/>;
}

export default InformationRoute;
