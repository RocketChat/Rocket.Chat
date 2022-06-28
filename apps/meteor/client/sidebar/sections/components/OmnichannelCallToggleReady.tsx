import { Sidebar } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useCallback } from 'react';

// import { useCallActions, useCallClient } from '../../../contexts/CallContext';
import { useVoipAgent } from '../hooks/useVoipAgent';

export const OmnichannelCallToggleReady = (): ReactElement => {
	const t = useTranslation();

	const { agentEnabled, networkStatus, registered, voipButtonEnabled, setAgentEnabled } = useVoipAgent();
	const onClickVoipButton = useCallback((): void => {
		if (voipButtonEnabled) {
			return;
		}

		setAgentEnabled(!agentEnabled);
	}, [agentEnabled, setAgentEnabled, voipButtonEnabled]);

	const getTitle = (): string => {
		if (networkStatus === 'offline') {
			return t('Signaling_connection_disconnected');
		}
		if (registered) {
			return t('Enable');
		}
		if (!voipButtonEnabled) {
			// Color for this state still not defined
			return t('Disable');
		}

		return t('Cannot_disable_while_on_call');
	};

	const getIcon = (): 'phone-issue' | 'phone' | 'phone-disabled' => {
		if (networkStatus === 'offline') {
			return 'phone-issue';
		}
		return registered ? 'phone' : 'phone-disabled';
	};

	const getColor = (): 'warning' | 'success' | undefined => {
		if (networkStatus === 'offline') {
			return 'warning';
		}
		return registered ? 'success' : undefined;
	};

	const voipCallIcon = {
		title: getTitle(),
		icon: getIcon(),
		color: getColor(),
	};

	return <Sidebar.TopBar.Action {...voipCallIcon} onClick={onClickVoipButton} disabled={voipButtonEnabled} />;
};
