import React, { ReactElement } from 'react';

import { useIsCallReady } from '../../../contexts/CallContext';
import { OmnichannelCallToogleLoading } from './OmnichannelCallToogleLoading';
import { OmnichannelCallToogleReady } from './OmnichannelCallToogleReady';

export const OmnichannelCallToogle = (): ReactElement => {
	const isCallReady = useIsCallReady();
	if (!isCallReady) {
		return <OmnichannelCallToogleLoading />;
	}
	return <OmnichannelCallToogleReady />;
};
