import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { ElementType } from 'react';

export const useCreateRoomModal = (Component: ElementType<{ onClose: () => void }>): (() => void) => {
	const setModal = useSetModal();

	return useEffectEvent(() => {
		const handleClose = (): void => {
			setModal(null);
		};

		setModal(<Component onClose={handleClose} />);
	});
};
