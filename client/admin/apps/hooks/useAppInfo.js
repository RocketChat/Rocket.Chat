import { useState, useEffect, useContext } from 'react';

import { Apps } from '../../../../app/apps/client/orchestrator';
import { AppDataContext } from '../AppProvider';
import { handleAPIError } from '../helpers';

const getBundledIn = async (appId, appVersion) => {
	try {
		const { bundledIn } = await Apps.getLatestAppFromMarketplace(appId, appVersion);
		bundledIn && await Promise.all(bundledIn.map((bundle, i) => Apps.getAppsOnBundle(bundle.bundleId).then((value) => {
			bundle.apps = value.slice(0, 4);
			bundledIn[i] = bundle;
		})));
		return bundledIn;
	} catch (e) {
		handleAPIError(e);
	}
};

export const useAppInfo = (appId) => {
	const { data, dataCache } = useContext(AppDataContext);

	const [appData, setAppData] = useState({});

	useEffect(() => {
		(async () => {
			if (!data.length) { return; }
			const app = data.find(({ id }) => id === appId);
			const bundledIn = await getBundledIn(app.id, app.version);

			setAppData({ ...app, bundledIn });
		})();
	}, [appId, data, dataCache]);

	return appData;
};
