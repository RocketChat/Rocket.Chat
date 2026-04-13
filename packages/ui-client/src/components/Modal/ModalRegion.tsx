import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useCurrentModal, useModal } from '@rocket.chat/ui-contexts';
import { lazy, Suspense } from 'react';

import ModalBackdrop from './ModalBackdrop';
import ModalPortal from './ModalPortal';

const FocusScope = lazy(() => import('react-aria').then((module) => ({ default: module.FocusScope })));

const ModalRegion = () => {
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
				<Suspense fallback={null}>
					<FocusScope contain restoreFocus autoFocus>
						{currentModal}
					</FocusScope>
				</Suspense>
			</ModalBackdrop>
		</ModalPortal>
	);
};

export default ModalRegion;
