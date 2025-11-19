import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { useMemo } from 'react';

import OutboundMessageModal from './OutboundMessageModal';

export const useOutboundMessageModal = () => {
	const setModal = useSetModal();

	const close = useEffectEvent((): void => setModal(null));

	const open = useEffectEvent((defaultValues?: ComponentProps<typeof OutboundMessageModal>['defaultValues']) => {
		setModal(<OutboundMessageModal defaultValues={defaultValues} onClose={close} />);
	});

	return useMemo(() => ({ open, close }), [open, close]);
};
