import { ModalContext } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import React from 'react';

export const MockedModalContext = ({ children }: { children: React.ReactNode }) => {
	const [currentModal, setCurrentModal] = React.useState<ReactNode>(null);
	const [dismissAction, setDismissAction] = React.useState<() => void>(() => null);

	return (
		<ModalContext.Provider
			value={{
				modal: {
					setModal: setCurrentModal,
					onDismissModal: setDismissAction,
					dismissAction,
				},
				currentModal: { component: currentModal },
			}}
		>
			{children}
		</ModalContext.Provider>
	);
};
