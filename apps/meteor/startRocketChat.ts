import { startLicense } from './ee/app/license/server/startup';
import { registerEEBroker } from './ee/server';

const loadBeforeLicense = async () => {
	await registerEEBroker();
};

export const startRocketChat = async () => {
	await loadBeforeLicense();

	await startLicense();
};
