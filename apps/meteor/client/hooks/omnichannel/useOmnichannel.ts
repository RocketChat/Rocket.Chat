import { useContext } from 'react';

import { OmnichannelContext, OmnichannelContextValue } from '../../contexts/OmnichannelContext';

export const useOmnichannel = (): OmnichannelContextValue => useContext(OmnichannelContext);
