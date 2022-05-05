import { useContext } from 'react';

import { OmnichannelContext, OmnichannelContextValue } from '../OmnichannelContext';

export const useOmnichannel = (): OmnichannelContextValue => useContext(OmnichannelContext);
