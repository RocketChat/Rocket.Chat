import React from 'react';
import toastr from 'toastr';

import { ToastMessagesContext } from '../contexts/ToastMessagesContext';
import { handleError } from '../../app/utils/client';

const dispatch = ({ type, message, title, options }) => {
	if (type === 'error' && typeof message === 'object') {
		handleError(message);
		return;
	}

	toastr[type](message, title, options);
};

const contextValue = { dispatch };

export function ToastMessagesProvider({ children }) {
	return <ToastMessagesContext.Provider children={children} value={contextValue} />;
}
