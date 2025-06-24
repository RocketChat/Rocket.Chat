import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRole, useSetModal } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import OutboundMessageUpsellModal from './OutboundMessageUpsellModal';
import { useHasLicenseModule } from '../../../../../hooks/useHasLicenseModule';

export const useOutboundMessageUpsellModal = () => {
	const setModal = useSetModal();
	const isAdmin = useRole('admin');
	const hasModule = useHasLicenseModule('outbound-message') === true;

	const close = useEffectEvent(() => setModal(null));
	const open = useEffectEvent(() => setModal(<OutboundMessageUpsellModal isAdmin={isAdmin} hasModule={hasModule} onClose={close} />));

	return useMemo(() => ({ open, close }), [open, close]);
};
