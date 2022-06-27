/**
 * This file is sample code to use outbound calling.
 * Once the dialpad is in-place, this file should be removed.
 */
import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement } from 'react';

import { useOutboundDialer } from '../../../../ee/client/hooks/useOutboundDialer';

export const OmnichannelMakeCall = (): ReactElement => {
	const voipData = useOutboundDialer();

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
		if (!voipData.outboundDialer) {
			return;
		}
		voipData.outboundDialer.makeCall('sip:70010@omni-asterisk.dev.rocket.chat');
	});

	return <Sidebar.TopBar.Action {...voipCallIcon} onClick={makeCall} />;
};
