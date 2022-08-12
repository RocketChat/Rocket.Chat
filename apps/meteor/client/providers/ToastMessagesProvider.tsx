import { ToastBarProvider, useToastBarDispatch } from '@rocket.chat/fuselage-toastbar';
import { ToastMessagesContext } from '@rocket.chat/ui-contexts';
import React, { FC, useEffect } from 'react';

import { getErrorMessage } from '../lib/errorHandling';
import { dispatchToastMessage, subscribeToToastMessages } from '../lib/toast';

const contextValue = {
	dispatch: dispatchToastMessage,
};

const ToastMessageInnerProvider: FC = ({ children }) => {
	const dispatchToastBar = useToastBarDispatch();

	useEffect(
		() =>
			subscribeToToastMessages(({ type, message, title = '' }) => {
				if (type === 'error' && typeof message === 'object') {
					dispatchToastBar({ type, message: getErrorMessage(message) });
					return;
				}

				if (typeof message !== 'string' && message instanceof Error) {
					message = `[${message.name}] ${message.message}`;
				}

				if (type === 'warning') {
					return;
				}

				dispatchToastBar({ type, message: title + message });
			}),
		[dispatchToastBar],
	);

	return <ToastMessagesContext.Provider children={children} value={contextValue} />;
};

// eslint-disable-next-line react/no-multi-comp
const ToastMessagesProvider: FC = ({ children }) => (
	<ToastBarProvider>
		<ToastMessageInnerProvider children={children} />
	</ToastBarProvider>
);

export default ToastMessagesProvider;
