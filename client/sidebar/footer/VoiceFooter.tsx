import { Skeleton } from '@rocket.chat/fuselage';
import React, { FC, ReactElement } from 'react';

import { useIsCallReady } from '../../contexts/CallContext';
import VoiceController from './VoiceController';

const VoiceFooter: FC = (): ReactElement | null => {
	const ready = useIsCallReady();

	if (!ready) {
		return <Skeleton />;
	}

	return <VoiceController />;
};

export default VoiceFooter;
