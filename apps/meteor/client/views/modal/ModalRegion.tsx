import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useCurrentModal, useModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { lazy } from 'react';

import ModalBackdrop from '../../components/ModalBackdrop';
import ModalPortal from '../../portals/ModalPortal';

const FocusScope = lazy(() => import('react-aria').then((module) => ({ default: module.FocusScope })));

const ModalRegion = (): ReactElement | null => {
	const currentModal = useCurrentModal();
	const { setModal } = useModal();
	const handleDismiss = useEffectEvent(() => {
		setModal(null);
	});

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
