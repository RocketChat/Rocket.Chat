import { useContext } from 'react';

import type { ToastMessagesContextValue } from '../ToastMessagesContext';
import { ToastMessagesContext } from '../ToastMessagesContext';

export const useToastMessageDispatch = (): ToastMessagesContextValue['dispatch'] => useContext(ToastMessagesContext).dispatch;
