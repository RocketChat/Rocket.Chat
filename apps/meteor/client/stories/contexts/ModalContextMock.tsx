import { ModalContext } from '@rocket.chat/ui-contexts';
import { action } from '@storybook/addon-actions';
import type { ContextType, ReactElement, ReactNode } from 'react';
import React, { useContext, useMemo } from 'react';

const logAction = action('ModalContext');

type ModalContextMockProps = {
	children: ReactNode;
};

const ModalContextMock = ({ children }: ModalContextMockProps): ReactElement => {
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

	return <ModalContext.Provider children={children} value={value} />;
};

export default ModalContextMock;
