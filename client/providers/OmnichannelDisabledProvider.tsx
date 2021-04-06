import React, { FC } from 'react';

import { OmnichannelContext, OmnichannelContextValue } from '../contexts/OmnichannelContext';

const emptyContext: OmnichannelContextValue = {
	inquiries: { enabled: false },
	enabled: false,
	agentAvailable: false,
	showOmnichannelQueueLink: false,
};

const OmnichannelDisabledProvider: FC = ({ children }) => (
	<OmnichannelContext.Provider value={emptyContext} children={children} />
);

export default OmnichannelDisabledProvider;
