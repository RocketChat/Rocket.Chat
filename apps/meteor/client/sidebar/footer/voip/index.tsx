import type { VoIpCallerInfo } from '@rocket.chat/core-typings';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import { useVoipFooterMenu } from '../../../../ee/client/hooks/useVoipFooterMenu';
import {
	useCallActions,
	useCallCreateRoom,
	useCallerInfo,
	useCallOpenRoom,
	useIsVoipEnterprise,
	useOpenedRoomInfo,
	useQueueCounter,
	useQueueName,
} from '../../../contexts/CallContext';
import SidebarFooterDefault from '../SidebarFooterDefault';
import { VoipFooter as VoipFooterComponent } from './VoipFooter';

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
	const options = useVoipFooterMenu();

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

	const tooltips = {
		mute: t('Mute'),
		holdCall: t('Hold_Call'),
		holdCallEEOnly: t('Hold_Call_EE_only'),
		acceptCall: t('Accept_Call'),
		endCall: t('End_Call'),
	};

	const getCallsInQueueText = useMemo((): string => {
		if (queueCounter === 0) {
			return t('Calls_in_queue_empty');
		}

		if (queueCounter === 1) {
			return t('Calls_in_queue', { calls: queueCounter });
		}

		return t('Calls_in_queue_plural', { calls: queueCounter });
	}, [queueCounter, t]);

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
			tooltips={tooltips}
			createRoom={createRoom}
			openRoom={openRoom}
			callsInQueue={getCallsInQueueText}
			dispatchEvent={dispatchEvent}
			openedRoomInfo={openedRoomInfo}
			isEnterprise={isEnterprise}
			options={options}
		/>
	);
};
