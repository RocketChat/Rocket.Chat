import { useModal, useCurrentModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { lazy, useCallback } from 'react';

import ModalBackdrop from '../../components/modal/ModalBackdrop';
import ModalPortal from '../../components/modal/ModalPortal';

const FocusScope = lazy(() => import('react-aria').then((module) => ({ default: module.FocusScope })));

const ModalRegion = ({ region = 'default' }): ReactElement | null => {
	const currentModal = useCurrentModal(region);
	const { setModal } = useModal();
	const handleDismiss = useCallback(() => setModal(null, region), [setModal, region]);

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
