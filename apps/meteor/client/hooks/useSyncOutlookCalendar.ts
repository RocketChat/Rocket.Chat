/* eslint-disable new-cap */
import { getDesktopApp } from '../lib/utils/getDesktopApp';

export const useSyncOutlookEvents = (): (() => Promise<void>) => {
	const date = new Date();
	const desktopApp = getDesktopApp();

	const syncEvents = async () => {
		if (!desktopApp) {
			return;
		}

		const response = await desktopApp.getOutlookEvents(date);
		if (response.status === 'canceled') {
			throw new Error('abort');
		}
	};

	return syncEvents;
};
