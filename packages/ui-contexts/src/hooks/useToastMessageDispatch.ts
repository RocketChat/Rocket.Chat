import { useContext } from 'react';

import { ToastMessagesContext, ToastMessagesContextValue } from '../ToastMessagesContext';

export const useToastMessageDispatch = (): ToastMessagesContextValue['dispatch'] => useContext(ToastMessagesContext).dispatch;
