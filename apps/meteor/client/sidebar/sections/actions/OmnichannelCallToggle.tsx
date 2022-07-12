import React, { ReactElement } from 'react';

import { useIsCallReady, useIsCallError } from '../../../contexts/CallContext';
import { OmnichannelCallToggleError } from './OmnichannelCallToggleError';
import { OmnichannelCallToggleLoading } from './OmnichannelCallToggleLoading';
import { OmnichannelCallToggleReady } from './OmnichannelCallToggleReady';

export const OmnichannelCallToggle = (): ReactElement => {
	const isCallReady = useIsCallReady();
	const isCallError = useIsCallError();
	if (isCallError) {
		return <OmnichannelCallToggleError />;
	}

	if (!isCallReady) {
		return <OmnichannelCallToggleLoading />;
	}

	return <OmnichannelCallToggleReady />;
};
