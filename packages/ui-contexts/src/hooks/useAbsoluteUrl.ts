import { useContext } from 'react';

import { ServerContext } from '../ServerContext';

export const useAbsoluteUrl = (): ((path: string) => string) => useContext(ServerContext).absoluteUrl;
