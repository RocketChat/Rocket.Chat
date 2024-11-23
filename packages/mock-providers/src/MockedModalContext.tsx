import { ModalContext } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import React, { useState } from 'react';

export const MockedModalContext = ({ children }: { children: React.ReactNode }) => {
	const [currentModal, setCurrentModal] = useState<ReactNode>(null);

	return (
		<ModalContext.Provider
			value={{
				modal: {
					setModal: setCurrentModal,
				},
				currentModal: { component: currentModal },
			}}
		>
			{children}
		</ModalContext.Provider>
	);
};
