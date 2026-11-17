import { useContext } from 'react';

import { ConnectionStatusContext } from '../ConnectionStatusContext';

export const useGetConnectionSessionId = (): (() => string | undefined) => useContext(ConnectionStatusContext).getSessionId;
