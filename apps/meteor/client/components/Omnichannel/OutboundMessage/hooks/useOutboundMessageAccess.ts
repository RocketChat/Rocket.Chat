import { usePermission } from '@rocket.chat/ui-contexts';

import { useOmnichannelEnabled } from '../../../../hooks/omnichannel/useOmnichannelEnabled';
import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';

export const useOutboundMessageAccess = (): boolean => {
	const isOmnichannelEnabled = useOmnichannelEnabled();
	const hasOmnichannelModule = useHasLicenseModule('livechat-enterprise') === true;
	const hasOutboundModule = useHasLicenseModule('outbound-messaging') === true;
	const hasPermission = usePermission('outbound.send-messages');

	if (!isOmnichannelEnabled) {
		return false;
	}

	if (!hasOmnichannelModule || !hasOutboundModule) {
		return true;
	}

	return hasPermission;
};
