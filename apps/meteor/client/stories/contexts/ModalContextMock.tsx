import { ModalContext } from '@rocket.chat/ui-contexts';
import type { ContextType, ReactNode } from 'react';
import { useContext, useMemo } from 'react';
import { action } from 'storybook/actions';

const logAction = action('ModalContext');

type ModalContextMockProps = {
	children: ReactNode;
};

const ModalContextMock = ({ children }: ModalContextMockProps) => {
	const context = useContext(ModalContext);

	const value = useMemo(
		(): ContextType<typeof ModalContext> =>
			context?.modal
				? {
						modal: {
							...context.modal,
							setModal: (modal): void => {
								logAction('setModal', modal);
							},
						},
						currentModal: context.currentModal,
					}
				: undefined,
		[context],
	);

	return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

export default ModalContextMock;
