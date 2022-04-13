import { ModalContext } from '@rocket.chat/ui-contexts';
import { action } from '@storybook/addon-actions';
import React, { ContextType, ReactElement, ReactNode, useMemo } from 'react';

const logAction = action('ModalContext');

type ModalContextMockProps = {
	children: ReactNode;
};

const ModalContextMock = ({ children }: ModalContextMockProps): ReactElement => {
	const value = useMemo(
		(): ContextType<typeof ModalContext> => ({
			open: (...args): void => logAction('open', ...args),
			push: (...args): void => logAction('push', ...args),
			cancel: (...args): void => logAction('cancel', ...args),
			close: (...args): void => logAction('close', ...args),
			confirm: (...args): void => logAction('confirm', ...args),
			setModal: (modal): void => {
				logAction('setModal', modal);
			},
		}),
		[],
	);

	return <ModalContext.Provider children={children} value={value} />;
};

export default ModalContextMock;
