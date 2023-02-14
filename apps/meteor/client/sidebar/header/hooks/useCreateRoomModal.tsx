import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { MouseEvent, FC } from 'react';
import React from 'react';

import { popover } from '../../../../app/ui-utils/client';

export const useCreateRoomModal = (Component: FC<any>): ((e: MouseEvent<HTMLElement>) => void) => {
	const setModal = useSetModal();

	return useMutableCallback((e) => {
		popover.close();

		e.preventDefault();

		const handleClose = (): void => {
			setModal(null);
		};

		setModal(() => <Component onClose={handleClose} />);
	});
};
