import { createContext, useContext } from 'react';

export const ToastMessagesContext = createContext({
	dispatch: () => {},
});

export const useDispatchToastMessage = () => useContext(ToastMessagesContext).dispatch;
