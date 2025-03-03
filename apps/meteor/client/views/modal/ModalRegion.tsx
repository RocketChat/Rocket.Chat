import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useCurrentModal, useModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { lazy, Suspense } from 'react';

import ModalBackdrop from '../../components/ModalBackdrop';
import ModalPortal from '../../portals/ModalPortal';

const FocusScope = lazy(() => import('react-aria').then(({ FocusScope }) => ({ default: FocusScope })));

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
