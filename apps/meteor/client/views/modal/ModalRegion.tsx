import { useModal, useCurrentModal } from '@rocket.chat/ui-contexts';
import React, { useCallback, ReactElement } from 'react';
import { FocusScope } from 'react-aria';

import ModalBackdrop from '../../components/modal/ModalBackdrop';
import ModalPortal from '../../components/modal/ModalPortal';

const ModalRegion = (): ReactElement | null => {
	const currentModal = useCurrentModal();
	const { setModal } = useModal();
	const handleDismiss = useCallback(() => setModal(null), [setModal]);

	if (!currentModal) {
		return null;
	}

	return (
		<ModalPortal>
			<ModalBackdrop onDismiss={handleDismiss}>
				<FocusScope contain restoreFocus autoFocus>
					{currentModal}
				</FocusScope>
			</ModalBackdrop>
		</ModalPortal>
	);
};

export default ModalRegion;
