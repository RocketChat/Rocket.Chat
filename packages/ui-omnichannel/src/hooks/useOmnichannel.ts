import { useContext } from 'react';

import { OmnichannelContext } from '../OmnichannelContext';

export const useOmnichannel = () => useContext(OmnichannelContext);
