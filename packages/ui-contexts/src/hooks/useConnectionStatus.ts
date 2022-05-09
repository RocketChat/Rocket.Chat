import { useContext } from 'react';

import { ConnectionStatusContext, ConnectionStatusContextValue } from '../ConnectionStatusContext';

export const useConnectionStatus = (): ConnectionStatusContextValue => useContext(ConnectionStatusContext);
