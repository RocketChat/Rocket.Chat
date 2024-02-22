import { ModalContext } from '@rocket.chat/ui-contexts';
import type { ModalContextValue } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import React, { useState, useMemo, memo, Suspense, createElement, useEffect } from 'react';

import { imperativeModal } from '../lib/imperativeModal';

const mapCurrentModal = (descriptor: typeof imperativeModal.current): ReactNode => {
	if (descriptor === null) {
		return null;
	}

	if ('component' in descriptor) {
		return {
			component: (
				<Suspense fallback={<div />}>
					{createElement(descriptor.component, {
						key: Math.random(),
						...descriptor.props,
					})}
				</Suspense>
			),
		};
	}
};

type ModalProviderProps = {
	children?: ReactNode;
};

const ModalProvider = ({ children }: ModalProviderProps) => {
	const [currentModal, setCurrentModal] = useState<ModalContextValue['currentModal']>(() => mapCurrentModal(imperativeModal.current));

	const setModal = (modal: ReactNode, region = 'default') => {
		setCurrentModal({ component: modal, region });
	};

	const contextValue = useMemo(
		() => ({
			modal: {
				setModal,
			},
			currentModal: {
				...currentModal,
			},
		}),
		[currentModal],
	);

	useEffect(
		() =>
			imperativeModal.on('update', (descriptor) => {
				setCurrentModal(mapCurrentModal(descriptor));
			}),
		[],
	);

	return <ModalContext.Provider value={contextValue} children={children} />;
};

export default memo<typeof ModalProvider>(ModalProvider);
