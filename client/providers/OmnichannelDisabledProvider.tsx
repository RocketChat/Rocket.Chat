import React, { FC } from 'react';

import { OmnichannelContext, OmnichannelContextValue } from '../contexts/OmnichannelContext';

const emptyContext = {
	inquiries: { enabled: false },
	enabled: false,
	agentAvailable: false,
	showOmnichannelQueueLink: false,
} as OmnichannelContextValue;

const OmnichannelDisabledProvider: FC = ({ children }) => (
	<OmnichannelContext.Provider value={emptyContext} children={children} />
);

export default OmnichannelDisabledProvider;
