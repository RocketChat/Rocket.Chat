import { registerEEBroker } from './ee/server';
import { restoreDiscussionEnabledWithoutLicense } from './ee/server/lib/abac/discussionEnforcementOverride';
import { enforceFipsLicense } from './ee/server/lib/license/enforceFipsLicense';
import { startLicense } from './ee/server/lib/license/startup';
import { unloadSamlServiceProvidersWithoutLicense } from './ee/server/lib/saml/serviceProviders';
import { startFederationService as startFederationMatrixService } from './ee/server/startup/federation';

const loadBeforeLicense = async () => {
	await registerEEBroker();
};

const loadAfterLicense = async () => {
	await startFederationMatrixService();
	await restoreDiscussionEnabledWithoutLicense();
	await unloadSamlServiceProvidersWithoutLicense();
};

export const startRocketChat = async () => {
	await loadBeforeLicense();

	await startLicense();

	enforceFipsLicense();

	await loadAfterLicense();
};
