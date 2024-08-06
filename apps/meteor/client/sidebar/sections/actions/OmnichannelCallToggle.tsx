import type { ReactElement } from 'react';
import React from 'react';

import { useIsCallError, useIsCallReady } from '../../../contexts/OmnichannelCallContext';
import { OmnichannelCallToggleError } from './OmnichannelCallToggleError';
import { OmnichannelCallToggleLoading } from './OmnichannelCallToggleLoading';
import { OmnichannelCallToggleReady } from './OmnichannelCallToggleReady';

export const OmnichannelCallToggle = ({ ...props }): ReactElement => {
	const isCallReady = useIsCallReady();
	const isCallError = useIsCallError();
	if (isCallError) {
		return <OmnichannelCallToggleError {...props} />;
	}

	if (!isCallReady) {
		return <OmnichannelCallToggleLoading {...props} />;
	}

	return <OmnichannelCallToggleReady {...props} />;
};
