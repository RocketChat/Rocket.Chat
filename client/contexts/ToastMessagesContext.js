import { createContext, useContext } from 'react';

export const ToastMessagesContext = createContext({
	dispatch: () => {},
});

export const useToastMessageDispatch = () => useContext(ToastMessagesContext).dispatch;
