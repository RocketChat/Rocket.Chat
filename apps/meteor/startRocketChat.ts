import { startLicense } from './ee/app/license/server/startup';
import { registerEEBroker } from './ee/server';
import { startFederationService, startFederationHomeserverService } from './ee/server/startup/services';

const loadBeforeLicense = async () => {
	await registerEEBroker();
};

const loadAfterLicense = async () => {
	await startFederationService();
	await startFederationHomeserverService();
};

export const startRocketChat = async () => {
	await loadBeforeLicense();

	await startLicense();

	await loadAfterLicense();
};
