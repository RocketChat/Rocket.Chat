import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { CurrentModalContext, ModalContext } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo, memo, useSyncExternalStore } from 'react';

import { modalStore } from './ModalStore';

export type ModalProviderProps = {
	children?: ReactNode;
	region?: symbol;
};

const ModalProvider = ({ children, region }: ModalProviderProps) => {
	const currentModal = useSyncExternalStore(modalStore.subscribe, modalStore.getSnapshot);

	const setModal = useStableCallback((modal: ReactNode | (() => ReactNode)) => {
		if (typeof modal === 'function') {
			modalStore.open(modal(), region);
			return;
		}
		modalStore.open(modal, region);
	});

	const actionsValue = useMemo(() => ({ modal: { setModal }, region }), [region, setModal]);

	const currentModalValue = useMemo(
		() => ({ component: currentModal?.node, region: currentModal?.region }),
		[currentModal?.node, currentModal?.region],
	);

	return (
		<ModalContext.Provider value={actionsValue}>
			<CurrentModalContext.Provider value={currentModalValue}>{children}</CurrentModalContext.Provider>
		</ModalContext.Provider>
	);
};

export default memo<typeof ModalProvider>(ModalProvider);
