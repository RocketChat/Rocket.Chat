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
			<Suspense fallback={null}>
				<ModalBackdrop onDismiss={handleDismiss}>
					<FocusScope contain restoreFocus autoFocus>
						<Suspense fallback={<div />}>{currentModal}</Suspense>
					</FocusScope>
				</ModalBackdrop>
			</Suspense>
		</ModalPortal>
	);
};

export default ModalRegion;
