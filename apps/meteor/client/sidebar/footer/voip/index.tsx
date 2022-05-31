import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import {
	useCallActions,
	useCallCreateRoom,
	useCallerInfo,
	useCallOpenRoom,
	useOpenedRoomInfo,
	useQueueCounter,
	useQueueName,
} from '../../../contexts/CallContext';
import { VoipFooter as VoipFooterComponent } from './VoipFooter';

export const VoipFooter = (): ReactElement | null => {
	const t = useTranslation();
	const callerInfo = useCallerInfo();
	const callActions = useCallActions();
	const dispatchEvent = useEndpoint('POST', 'voip/events');

	const createRoom = useCallCreateRoom();
	const openRoom = useCallOpenRoom();
	const queueCounter = useQueueCounter();
	const queueName = useQueueName();
	const openedRoomInfo = useOpenedRoomInfo();

	const [muted, setMuted] = useState(false);
	const [paused, setPaused] = useState(false);

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

	const getSubtitle = (): string => {
		switch (callerInfo.state) {
			case 'IN_CALL':
				return t('In_progress');
			case 'OFFER_RECEIVED':
				return t('Ringing');
			case 'ON_HOLD':
				return t('On_Hold');
		}

		return '';
	};

	const tooltips = {
		mute: t('Mute'),
		holdCall: t('Hold_Call'),
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
		return null;
	}

	return (
		<VoipFooterComponent
			caller={callerInfo.caller}
			callerState={callerInfo.state}
			callActions={callActions}
			title={queueName || t('Phone_call')}
			subtitle={getSubtitle()}
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
			anonymousText={t('Anonymous')}
		/>
	);
};
