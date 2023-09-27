import { useModal, useCurrentModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { lazy, useCallback } from 'react';

import ModalBackdrop from '../../components/modal/ModalBackdrop';
import ModalPortal from '../../components/modal/ModalPortal';
import { useCloudAnnouncementModals } from './hooks/useCloudAnnouncementModals';

const FocusScope = lazy(() => import('react-aria').then((module) => ({ default: module.FocusScope })));

const ModalRegion = (): ReactElement | null => {
	const currentModal = useCurrentModal();
	const { setModal } = useModal();
	const handleDismiss = useCallback(() => setModal(null), [setModal]);
	useCloudAnnouncementModals();

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
