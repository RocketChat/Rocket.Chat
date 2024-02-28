import { ModalContext } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import React, { useState, useMemo, memo, Suspense, createElement, useEffect } from 'react';

import { imperativeModal } from '../lib/imperativeModal';

const mapCurrentModal = (descriptor: typeof imperativeModal.current): ReactNode => {
	if (descriptor === null) {
		return null;
	}

	if ('component' in descriptor) {
		return (
			<Suspense fallback={<div />}>
				{createElement(descriptor.component, {
					key: Math.random(),
					...descriptor.props,
				})}
			</Suspense>
		);
	}
};

type ModalProviderProps = {
	children?: ReactNode;
};

const ModalProvider = ({ children }: ModalProviderProps) => {
	const [currentModal, setCurrentModal] = useState<ReactNode>(() => mapCurrentModal(imperativeModal.current));

	const contextValue = useMemo(
		() => ({
			modal: {
				setModal: setCurrentModal,
			},
			currentModal,
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
