import { ModalContext } from '@rocket.chat/ui-contexts';
import type { ContextType, ReactNode } from 'react';
import { useMemo } from 'react';

type ModalContextMockProps = {
	children: ReactNode;
};

const ModalContextMock = ({ children }: ModalContextMockProps) => {
	const value = useMemo(
		() => ({
			modal: {
				setModal: (): void => undefined,
			},
		}),
		[],
	);

	return <ModalContext.Provider value={value as unknown as ContextType<typeof ModalContext>}>{children}</ModalContext.Provider>;
};

export default ModalContextMock;
