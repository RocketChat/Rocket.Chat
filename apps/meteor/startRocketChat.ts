import { startLicense } from './ee/app/license/server/startup';
import { registerEEBroker } from './ee/server';
import { startFederationService as startFederationMatrixService } from './ee/server/startup/federation';

const loadBeforeLicense = async () => {
	await registerEEBroker();
};

const loadAfterLicense = async () => {
	await startFederationMatrixService();
};

export const startRocketChat = async () => {
	await loadBeforeLicense();

	await startLicense();

	await loadAfterLicense();
};
