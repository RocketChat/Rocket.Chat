import { useContext } from 'react';

import { ConnectionStatusContext } from '../ConnectionStatusContext';

export const useConnectionSessionId = (): string | undefined => useContext(ConnectionStatusContext).sessionId;
