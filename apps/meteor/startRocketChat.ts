import { startLicense } from './ee/app/license/server/startup';
import { registerEEBroker } from './ee/server';

const loadBeforeLicense = async () => {
	await registerEEBroker();
};

const loadAfterLicense = async () => {};

export const startRocketChat = async () => {
	await loadBeforeLicense();

	await startLicense();

	await loadAfterLicense();
};
