import { api } from '@rocket.chat/core-services';

import { EnterpriseSettings } from '../../app/settings/server/settings.internalService';
import { LDAPEEService } from '../local-services/ldap/service';
import { MessageReadsService } from '../local-services/message-reads/service';
import { InstanceService } from '../local-services/instance/service';
import { LicenseService } from '../../app/license/server/license.internalService';
import { isRunningMs } from '../../../server/lib/isRunningMs';
import { OmnichannelEE } from '../../app/livechat-enterprise/server/services/omnichannel.internalService';
import { FederationService } from '../../../server/services/federation/service';
import { FederationServiceEE } from '../local-services/federation/service';
import { isEnterprise, onLicense } from '../../app/license/server';

// TODO consider registering these services only after a valid license is added
api.registerService(new EnterpriseSettings());
api.registerService(new LDAPEEService());
api.registerService(new LicenseService());
api.registerService(new MessageReadsService());
api.registerService(new OmnichannelEE());

// when not running micro services we want to start up the instance intercom
if (!isRunningMs()) {
	api.registerService(new InstanceService());
}

let federationService: FederationService;

void (async () => {
	if (!isEnterprise()) {
		federationService = await FederationService.createFederationService();
		api.registerService(federationService);
	}
})();

await onLicense('federation', async () => {
	const federationServiceEE = new FederationServiceEE();
	if (federationService) {
		await api.destroyService(federationService);
	}
	api.registerService(federationServiceEE);
});
