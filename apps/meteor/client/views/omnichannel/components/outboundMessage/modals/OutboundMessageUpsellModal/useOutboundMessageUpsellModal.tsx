import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useLicense } from '@rocket.chat/ui-client';
import { useRole, useSetModal } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import OutboundMessageUpsellModal from './OutboundMessageUpsellModal';
import { useHasLicenseModule } from '../../../../../../hooks/useHasLicenseModule';

export const useOutboundMessageUpsellModal = () => {
	const setModal = useSetModal();
	const isAdmin = useRole('admin');
	const license = useLicense();
	const { data: hasModule = false } = useHasLicenseModule('outbound-messaging');

	const close = useEffectEvent(() => setModal(null));
	const open = useEffectEvent(() =>
		setModal(<OutboundMessageUpsellModal isCommunity={!license.data?.license} isAdmin={isAdmin} hasModule={hasModule} onClose={close} />),
	);

	return useMemo(() => ({ open, close }), [open, close]);
};
