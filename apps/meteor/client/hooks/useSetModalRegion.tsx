import { useUniqueId, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useModal } from '@rocket.chat/ui-contexts';
import React from 'react';
import type { ReactNode } from 'react';

import ModalRegion from '../views/modal/ModalRegion';

export const useSetModalRegion = (): { setModal: (modal?: ReactNode) => void; region: ReactNode } => {
	const id = useUniqueId();
	const { setModal } = useModal();
	const handleModal = useEffectEvent((modal?: ReactNode) => setModal(modal, id));
	return {
		setModal: handleModal,
		region: <ModalRegion region={id} />,
	};
};
