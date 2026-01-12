import { usePermission } from '@rocket.chat/ui-contexts';

import { useHasLicenseModule } from '../../../../../hooks/useHasLicenseModule';
import { useOmnichannelEnabled } from '../../../hooks/useOmnichannelEnabled';

export const useOutboundMessageAccess = (): boolean => {
	const isOmnichannelEnabled = useOmnichannelEnabled();
	const { data: hasOmnichannelModule = false } = useHasLicenseModule('livechat-enterprise');
	const { data: hasOutboundModule = false } = useHasLicenseModule('outbound-messaging');
	const hasPermission = usePermission('outbound.send-messages');

	if (!isOmnichannelEnabled) {
		return false;
	}

	if (!hasOmnichannelModule || !hasOutboundModule) {
		return true;
	}

	return hasPermission;
};
