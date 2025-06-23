import { useContext } from 'react';

import type { OmnichannelContextValue } from '../OmnichannelContext';
import { OmnichannelContext } from '../OmnichannelContext';

export const useOmnichannel = (): OmnichannelContextValue => useContext(OmnichannelContext);
