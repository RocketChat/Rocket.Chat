import { ModalContext } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useState } from 'react';

export const MockedModalContext = ({ children }: { children: ReactNode }) => {
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
