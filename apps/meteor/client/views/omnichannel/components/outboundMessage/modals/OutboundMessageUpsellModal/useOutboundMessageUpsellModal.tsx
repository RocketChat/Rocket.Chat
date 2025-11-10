import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRole, useSetModal } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import OutboundMessageUpsellModal from './OutboundMessageUpsellModal';
import { useHasLicenseModule } from '../../../../../../hooks/useHasLicenseModule';
import { useLicense } from '../../../../../../hooks/useLicense';

export const useOutboundMessageUpsellModal = () => {
	const setModal = useSetModal();
	const isAdmin = useRole('admin');
	const license = useLicense();
	const hasModule = useHasLicenseModule('outbound-messaging') === true;

	const close = useEffectEvent(() => setModal(null));
	const open = useEffectEvent(() =>
		setModal(<OutboundMessageUpsellModal isCommunity={!license.data?.license} isAdmin={isAdmin} hasModule={hasModule} onClose={close} />),
	);

	return useMemo(() => ({ open, close }), [open, close]);
};
