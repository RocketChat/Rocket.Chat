import { startLicense } from './ee/app/license/server/startup';
import { registerEEBroker } from './ee/server';
import { startFederationService } from './ee/server/startup/services';

const loadBeforeLicense = async () => {
	await registerEEBroker();
};

const loadAfterLicense = async () => {
	await startFederationService();
};

export const startRocketChat = async () => {
	await loadBeforeLicense();

	await startLicense();

	await loadAfterLicense();
};
