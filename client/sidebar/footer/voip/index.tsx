import React, { ReactElement, useCallback, useState } from 'react';

import { WrapUpCallModal } from '../../../components/voip/modal/WrapUpCallModal';
import { useCallActions, useCallerInfo, useCallOpenRoom } from '../../../contexts/CallContext';
import { useSetModal } from '../../../contexts/ModalContext';
import { useSetting } from '../../../contexts/SettingsContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { VoipFooter as VoipFooterComponent } from './VoipFooter';

export const VoipFooter = (): ReactElement | null => {
	const t = useTranslation();
	const callerInfo = useCallerInfo();
	const callActions = useCallActions();
	const openRoom = useCallOpenRoom();
	const wrapUpCallEnabled = useSetting('WrapUpCall_Enabled') as boolean;
	const setModal = useSetModal();

	const [muted, setMuted] = useState(false);
	const [paused, setPaused] = useState(false);

	const openWrapUpCallModal = useCallback(() => {
		setModal(<WrapUpCallModal />);
	}, [setModal]);

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
			caller={callerInfo.caller}
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
			wrapUpCallEnabled={wrapUpCallEnabled}
			openWrapUpCallModal={openWrapUpCallModal}
		/>
	);
};
