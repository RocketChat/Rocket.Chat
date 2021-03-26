import React, { FC } from 'react';
import toastr from 'toastr';

import { handleError } from '../../app/utils/client';
import { ToastMessagesContext, ToastMessagePayload } from '../contexts/ToastMessagesContext';

const dispatch = ({ type, message, title, options }: ToastMessagePayload): void => {
	if (type === 'error' && typeof message === 'object') {
		handleError(message);
		return;
	}

	if (typeof message !== 'string') {
		message = `[${message.name}] ${message.message}`;
	}

	toastr[type](message, title, options);
};

const contextValue = {
	dispatch,
};

const ToastMessagesProvider: FC = ({ children }) => (
	<ToastMessagesContext.Provider children={children} value={contextValue} />
);

export default ToastMessagesProvider;
