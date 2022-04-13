import { ToastMessagesContext } from '@rocket.chat/ui-contexts';
import React, { FC, useEffect } from 'react';
import toastr from 'toastr';

import { dispatchToastMessage, subscribeToToastMessages } from '../lib/toast';
import { handleError } from '../lib/utils/handleError';

const contextValue = {
	dispatch: dispatchToastMessage,
};

const ToastMessagesProvider: FC = ({ children }) => {
	useEffect(
		() =>
			subscribeToToastMessages(({ type, message, title, options }) => {
				if (type === 'error' && typeof message === 'object') {
					handleError(message);
					return;
				}

				if (typeof message !== 'string') {
					message = `[${message.name}] ${message.message}`;
				}

				toastr[type](message, title, options);
			}),
		[],
	);

	return <ToastMessagesContext.Provider children={children} value={contextValue} />;
};

export default ToastMessagesProvider;
