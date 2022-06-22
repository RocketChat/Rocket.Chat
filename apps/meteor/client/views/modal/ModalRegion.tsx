import { useModal } from '@rocket.chat/ui-contexts';
import React, { useCallback, ReactElement } from 'react';

import ModalBackdrop from '../../components/modal/ModalBackdrop';
import ModalPortal from '../../components/modal/ModalPortal';

const ModalRegion = (): ReactElement | null => {
	const { currentModal, setModal } = useModal();
	const handleDismiss = useCallback(() => setModal(null), [setModal]);

	if (!currentModal) {
		return null;
	}

	return (
		<ModalPortal>
			<ModalBackdrop onDismiss={handleDismiss}>{currentModal}</ModalBackdrop>
		</ModalPortal>
	);
};

export default ModalRegion;
