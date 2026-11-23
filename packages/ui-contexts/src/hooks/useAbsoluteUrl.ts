import { useContext } from 'react';

import { ServerContext } from '../ServerContext.js';

export const useAbsoluteUrl = (): ((path: string) => string) => useContext(ServerContext).absoluteUrl;
