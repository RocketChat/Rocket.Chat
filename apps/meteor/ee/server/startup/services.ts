import { api } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';

import { settings } from '../../../app/settings/server/cached';
import { isRunningMs } from '../../../server/lib/isRunningMs';
import { FederationService } from '../../../server/services/federation/service';
import { LicenseService } from '../../app/license/server/license.internalService';
import { OmnichannelEE } from '../../app/livechat-enterprise/server/services/omnichannel.internalService';
import { EnterpriseSettings } from '../../app/settings/server/settings.internalService';
import { FederationServiceEE } from '../local-services/federation/service';
import { InstanceService } from '../local-services/instance/service';
import { LDAPEEService } from '../local-services/ldap/service';
import { MessageReadsService } from '../local-services/message-reads/service';
import { VoipFreeSwitchService } from '../local-services/voip-freeswitch/service';

// TODO consider registering these services only after a valid license is added
api.registerService(new EnterpriseSettings(), ['settings', 'license']);
api.registerService(new LDAPEEService(), ['settings', 'license']);
api.registerService(new LicenseService(), ['settings', 'license']);
api.registerService(new MessageReadsService(), ['settings', 'license']);
api.registerService(new OmnichannelEE(), ['settings', 'license']);
api.registerService(new VoipFreeSwitchService((id) => settings.get(id)), ['settings', 'license']);

// when not running micro services we want to start up the instance intercom
if (!isRunningMs()) {
	api.registerService(new InstanceService(), ['settings', 'license']);
}

export const startFederationService = async (): Promise<void> => {
	let federationService: FederationService;

	if (!License.hasValidLicense()) {
		federationService = await FederationService.createFederationService();
		api.registerService(federationService, ['settings', 'license']);
	}

	void License.onLicense('federation', async () => {
		const federationServiceEE = await FederationServiceEE.createFederationService();
		if (federationService) {
			await api.destroyService(federationService);
		}
		api.registerService(federationServiceEE, ['settings', 'license']);
	});
};
