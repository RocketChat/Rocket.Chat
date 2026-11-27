import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { ModalContext, useModal } from '@rocket.chat/ui-contexts';
import { lazy, Suspense, useContext, useSyncExternalStore } from 'react';

import ModalBackdrop from './ModalBackdrop';
import ModalPortal from './ModalPortal';
import { modalStore } from '../../providers/ModalProvider/ModalStore';

const FocusScope = lazy(() => import('@react-aria/focus').then((module) => ({ default: module.FocusScope })));

const ModalRegion = () => {
	const stack = useSyncExternalStore(modalStore.subscribe, modalStore.getStackSnapshot);
	const context = useContext(ModalContext);
	const { setModal } = useModal();
	const handleDismiss = useStableCallback(() => {
		setModal(null);
	});

	const regionStack = stack.filter((entry) => entry.node != null && entry.region === context?.region);

	if (regionStack.length === 0) {
		return null;
	}

	return (
		<ModalPortal>
			<ModalBackdrop onDismiss={handleDismiss}>
				{regionStack.map((entry, index) => {
					const isTop = index === regionStack.length - 1;

					if (isTop) {
						return (
							<Suspense key={entry.id} fallback={null}>
								<FocusScope contain restoreFocus autoFocus>
									{entry.node}
								</FocusScope>
							</Suspense>
						);
					}

					return (
						<div key={entry.id} style={{ display: 'none' }}>
							{entry.node}
						</div>
					);
				})}
			</ModalBackdrop>
		</ModalPortal>
	);
};

export default ModalRegion;
