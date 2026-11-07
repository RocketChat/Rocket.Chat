import { useContext } from 'react';

import type { ToastMessagesContextValue } from '../ToastMessagesContext.js';
import { ToastMessagesContext } from '../ToastMessagesContext.js';

export const useToastMessageDispatch = (): ToastMessagesContextValue['dispatch'] => useContext(ToastMessagesContext).dispatch;
