import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import type { OutboundMessageModalProps } from './OutboundMessageModal';

// keeps the phone number library out of the main bundle
const OutboundMessageModal = lazy(() => import('./OutboundMessageModal'));

export const useOutboundMessageModal = () => {
	const setModal = useSetModal();

	const close = useStableCallback((): void => setModal(null));

	const open = useStableCallback((defaultValues?: OutboundMessageModalProps['defaultValues']) => {
		setModal(<OutboundMessageModal defaultValues={defaultValues} onClose={close} />);
	});

	return useMemo(() => ({ open, close }), [open, close]);
};
