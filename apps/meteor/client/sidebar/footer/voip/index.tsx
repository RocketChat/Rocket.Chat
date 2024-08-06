import type { VoIpCallerInfo } from '@rocket.chat/core-typings';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useState } from 'react';

import { useOmnichannelVoipFooterMenu } from '../../../../ee/client/hooks/useOmnichannelVoipFooterMenu';
import {
	useCallActions,
	useCallCreateRoom,
	useCallerInfo,
	useCallOpenRoom,
	useIsVoipEnterprise,
	useOpenedRoomInfo,
	useQueueCounter,
	useQueueName,
} from '../../../contexts/OmnichannelCallContext';
import SidebarFooterDefault from '../SidebarFooterDefault';
import { VoipFooter as VoipFooterComponent } from './OmnichannelVoipFooter';

export const VoipFooter = (): ReactElement | null => {
	const t = useTranslation();
	const callerInfo = useCallerInfo();
	const callActions = useCallActions();
	const dispatchEvent = useEndpoint('POST', '/v1/voip/events');

	const createRoom = useCallCreateRoom();
	const openRoom = useCallOpenRoom();
	const queueCounter = useQueueCounter();
	const queueName = useQueueName();
	const openedRoomInfo = useOpenedRoomInfo();
	const options = useOmnichannelVoipFooterMenu();

	const [muted, setMuted] = useState(false);
	const [paused, setPaused] = useState(false);
	const isEnterprise = useIsVoipEnterprise();

	const toggleMic = useCallback(
		(state: boolean) => {
			state ? callActions.mute() : callActions.unmute();
			setMuted(state);
		},
		[callActions],
	);

	const togglePause = useCallback(
		(state: boolean) => {
			state ? callActions.pause() : callActions.resume();
			setMuted(false);
			setPaused(state);
		},
		[callActions],
	);

	const getSubtitle = (state: VoIpCallerInfo['state']): string => {
		const subtitles: Record<string, string> = {
			IN_CALL: t('In_progress'),
			OFFER_RECEIVED: t('Ringing'),
			OFFER_SENT: t('Calling'),
			ON_HOLD: t('On_Hold'),
		};

		return subtitles[state] || '';
	};

	if (!('caller' in callerInfo)) {
		return <SidebarFooterDefault />;
	}

	return (
		<VoipFooterComponent
			caller={callerInfo.caller}
			callerState={callerInfo.state}
			callActions={callActions}
			title={queueName || t('Phone_call')}
			subtitle={getSubtitle(callerInfo.state)}
			muted={muted}
			paused={paused}
			toggleMic={toggleMic}
			togglePause={togglePause}
			createRoom={createRoom}
			openRoom={openRoom}
			callsInQueue={t('Calls_in_queue', { count: queueCounter })}
			dispatchEvent={dispatchEvent}
			openedRoomInfo={openedRoomInfo}
			isEnterprise={isEnterprise}
			options={options}
		/>
	);
};
