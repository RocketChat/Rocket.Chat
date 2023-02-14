import { useContext } from 'react';

import type { ConnectionStatusContextValue } from '../ConnectionStatusContext';
import { ConnectionStatusContext } from '../ConnectionStatusContext';

export const useConnectionStatus = (): ConnectionStatusContextValue => useContext(ConnectionStatusContext);
