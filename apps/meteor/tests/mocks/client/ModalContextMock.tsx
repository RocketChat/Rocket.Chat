import { ModalContext } from '@rocket.chat/ui-contexts';
import type { ReactElement, ContextType, ReactNode } from 'react';
import { useMemo } from 'react';

type ModalContextMockProps = {
	children: ReactNode;
};

const ModalContextMock = ({ children }: ModalContextMockProps): ReactElement => {
	const value = useMemo(
		() => ({
			modal: {
				setModal: (): void => undefined,
			},
		}),
		[],
	);

	return <ModalContext.Provider children={children} value={value as unknown as ContextType<typeof ModalContext>} />;
};

export default ModalContextMock;
