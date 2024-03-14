import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { ModalContext } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import React, { useMemo, memo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { modalStore } from './ModalStore';

type ModalProviderProps = {
	children?: ReactNode;
	region?: symbol;
};

const ModalProvider = ({ children, region }: ModalProviderProps) => {
	const currentModal = useSyncExternalStore(modalStore.subscribe, modalStore.getSnapshot);

	const setModal = useEffectEvent((modal: ReactNode | (() => ReactNode)) => {
		if (typeof modal === 'function') {
			modalStore.open(modal(), region);
			return;
		}
		modalStore.open(modal, region);
	});

	const contextValue = useMemo(
		() => ({
			modal: {
				setModal,
			},
			currentModal: {
				component: currentModal?.node,
				region: currentModal?.region,
			},
			region,
		}),
		[currentModal, region, setModal],
	);

	return <ModalContext.Provider value={contextValue} children={children} />;
};

export default memo<typeof ModalProvider>(ModalProvider);
