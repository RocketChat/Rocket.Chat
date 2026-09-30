import { CurrentModalContext, ModalContext } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

export type MockedModalContextProps = { children: ReactNode };

export const MockedModalContext = ({ children }: MockedModalContextProps) => {
	const [currentModal, setCurrentModal] = useState<ReactNode>(null);

	const actions = useMemo(() => ({ modal: { setModal: setCurrentModal } }), []);
	const current = useMemo(() => ({ component: currentModal }), [currentModal]);

	return (
		<ModalContext.Provider value={actions}>
			<CurrentModalContext.Provider value={current}>{children}</CurrentModalContext.Provider>
		</ModalContext.Provider>
	);
};
