import { useState, useEffect } from 'react';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';

import { Apps } from '../../../../app/apps/client/orchestrator';
import { AppEvents } from '../../../../app/apps/client/communication';
import { handleAPIError } from '../helpers';

const getBundledIn = async (bundledIn) => {
	try {
		bundledIn && await Promise.all(bundledIn.map((bundle, i) => Apps.getAppsOnBundle(bundle.bundleId).then((value) => {
			bundle.apps = value.slice(0, 4);
			bundledIn[i] = bundle;
		})));
	} catch (e) {
		handleAPIError(e);
	}

	return bundledIn;
};

const attachMarketplaceInfo = async (app) => {
	try {
		const {
			categories,
			isPurchased,
			price,
			bundledIn,
			purchaseType,
			subscriptionInfo,
			version: marketplaceVersion,
		} = await Apps.getLatestAppFromMarketplace(app.id, app.version);

		const bundledInWithApps = await getBundledIn(bundledIn);
		return { ...app, categories, isPurchased, price, purchaseType, subscriptionInfo, marketplaceVersion, bundledIn: bundledInWithApps };
	} catch (error) {
		if (error.xhr && error.xhr.status === 404) {
			return;
		}

		handleAPIError(error);
	}
};

const loadApp = async (id, setData) => {
	let app;
	try {
		app = await Apps.getApp(id);

		if (app) {
			app.installed = true;

			app = await attachMarketplaceInfo(app);

			setData(app);
			return;
		}
	} catch (error) {
		console.log(error);
	}

	try {
		app = await Apps.getAppFromMarketplace(id);
	} catch (error) {
		console.log(error);
	}

	const bundledIn = await getBundledIn(app.bundledIn);
	setData({ ...app, installed: false, marketplaceVersion: app.version, bundledIn });
};

export const useAppInfo = (id) => {
	const [data, setData] = useState({});

	const handleChange = useDebouncedCallback(() => {
		loadApp(id, setData);
	}, 100, []);

	useEffect(() => {
		loadApp(id, setData);

		Apps.getWsListener().registerListener(AppEvents.APP_ADDED, handleChange);
		Apps.getWsListener().registerListener(AppEvents.APP_UPDATED, handleChange);
		Apps.getWsListener().registerListener(AppEvents.APP_REMOVED, handleChange);
		Apps.getWsListener().registerListener(AppEvents.APP_STATUS_CHANGE, handleChange);

		() => {
			Apps.getWsListener().unregisterListener(AppEvents.APP_ADDED, handleChange);
			Apps.getWsListener().unregisterListener(AppEvents.APP_UPDATED, handleChange);
			Apps.getWsListener().unregisterListener(AppEvents.APP_REMOVED, handleChange);
			Apps.getWsListener().unregisterListener(AppEvents.APP_STATUS_CHANGE, handleChange);
		};
	}, []);

	return data;
};
