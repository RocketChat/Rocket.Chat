import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { useMemo } from 'react';

import OutboundMessageModal from './OutboundMessageModal';

export const useOutboundMessageModal = () => {
	const setModal = useSetModal();

	const close = useStableCallback((): void => setModal(null));

	const open = useStableCallback((defaultValues?: ComponentProps<typeof OutboundMessageModal>['defaultValues']) => {
		setModal(<OutboundMessageModal defaultValues={defaultValues} onClose={close} />);
	});

	return useMemo(() => ({ open, close }), [open, close]);
};
