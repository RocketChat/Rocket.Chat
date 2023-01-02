import { useContext } from 'react';

import type { OmnichannelContextValue } from '../../contexts/OmnichannelContext';
import { OmnichannelContext } from '../../contexts/OmnichannelContext';

export const useOmnichannel = (): OmnichannelContextValue => useContext(OmnichannelContext);
