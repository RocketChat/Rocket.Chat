import { useModal, useCurrentModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { lazy, useCallback } from 'react';

import ModalBackdrop from '../../components/ModalBackdrop';
import ModalPortal from '../../portals/ModalPortal';

const FocusScope = lazy(() => import('react-aria').then((module) => ({ default: module.FocusScope })));

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
