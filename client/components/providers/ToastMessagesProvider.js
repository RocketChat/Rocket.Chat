import React from 'react';
import toastr from 'toastr';

import { ToastMessagesContext } from '../../contexts/ToastMessagesContext';

const dispatch = ({ type, message, title, options }) => {
	toastr[type](message, title, options);
};

export function ToastMessagesProvider({ children }) {
	return <ToastMessagesContext.Provider
		children={children}
		value={{
			dispatch,
		}} />;
}
