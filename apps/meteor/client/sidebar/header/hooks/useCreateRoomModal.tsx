import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { ElementType } from 'react';
import React from 'react';

export const useCreateRoomModal = (Component: ElementType<{ onClose: () => void }>): (() => void) => {
	const setModal = useSetModal();

	return useMutableCallback(() => {
		const handleClose = (): void => {
			setModal(null);
		};

		setModal(() => <Component onClose={handleClose} />);
	});
};
