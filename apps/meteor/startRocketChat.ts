import { registerEEBroker } from './ee/server';
import { enforceFipsLicense } from './ee/server/lib/license/enforceFipsLicense';
import { startLicense } from './ee/server/lib/license/startup';
import { startFederationService as startFederationMatrixService } from './ee/server/startup/federation';
import { startXMPPServerService } from './ee/server/startup/xmppServer';

const loadBeforeLicense = async () => {
	await registerEEBroker();
};

const loadAfterLicense = async () => {
	await startFederationMatrixService();
	await startXMPPServerService();
};

export const startRocketChat = async () => {
	await loadBeforeLicense();

	await startLicense();

	enforceFipsLicense();

	await loadAfterLicense();
};
