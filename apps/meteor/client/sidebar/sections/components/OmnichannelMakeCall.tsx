import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement } from 'react';

import { useCallClient } from '../../../contexts/CallContext';

export const OmnichannelMakeCall = (): ReactElement => {
	const voipClient = useCallClient();

	const getTooltip = (): string => 'Click to dial 70010';

	const getIcon = (): 'phone' => 'phone';

	const getColor = (): 'success' => 'success';

	const voipCallIcon = {
		title: getTooltip(),
		color: getColor(),
		icon: getIcon(),
	} as const;

	// TODO: move registration flow to context provider
	const makeCall = useMutableCallback((): void => {
		voipClient.makeCall('sip:70010@omni-asterisk.dev.rocket.chat');
	});

	return <Sidebar.TopBar.Action {...voipCallIcon} onClick={makeCall} />;
};
