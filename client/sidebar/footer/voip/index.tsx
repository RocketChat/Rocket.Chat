import { Random } from 'meteor/random';
import React, { ReactElement, useCallback, useState } from 'react';

import { roomTypes } from '../../../../app/utils/client';
import { useCallActions, useCallerInfo } from '../../../contexts/CallContext';
import { useEndpoint } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useUser } from '../../../contexts/UserContext';
import { VoipFooter as VoipFooterComponent } from './VoipFooter';

export const VoipFooter = (): ReactElement | null => {
	const t = useTranslation();
	const callerInfo = useCallerInfo();
	const callActions = useCallActions();
	const user = useUser();

	const [muted, setMuted] = useState(false);
	const [paused, setPaused] = useState(false);

	const visitorEndpoint = useEndpoint('POST', 'livechat/visitor');
	const voipEndpoint = useEndpoint('GET', 'voip/room');

	const openRoom = useCallback(async () => {
		if (user) {
			if ('caller' in callerInfo) {
				const { visitor } = await visitorEndpoint({
					visitor: {
						token: Random.id(),
						phone: callerInfo?.caller.callerId,
						name: callerInfo.caller.callerName || callerInfo.caller.callerId,
					},
				});
				const voipRoom = visitor && (await voipEndpoint({ token: visitor.token, agentId: user._id }));
				voipRoom.room && roomTypes.openRouteLink(voipRoom.room.t, voipRoom.room);
			}
		}
	}, [callerInfo, user, visitorEndpoint, voipEndpoint]);

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
				return t('Calling');
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

	if (!('caller' in callerInfo)) {
		return null;
	}

	return (
		<VoipFooterComponent
			callerName={callerInfo.caller.callerName}
			callerState={callerInfo.state}
			callActions={callActions}
			title={t('Phone_call')}
			subtitle={getSubtitle()}
			muted={muted}
			paused={paused}
			toggleMic={toggleMic}
			togglePause={togglePause}
			tooltips={tooltips}
			openRoom={openRoom}
		/>
	);
};
