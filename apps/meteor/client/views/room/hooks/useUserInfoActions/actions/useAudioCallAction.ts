import { IRoom } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { Action } from '../../../../hooks/useActionSpread';
import { useWebRTC } from '../../useWebRTC';

export const useAudioCallAction = (rid: IRoom['_id']): Action | undefined => {
	const t = useTranslation();
	const { shouldAllowCalls, callInProgress, joinCall, startCall } = useWebRTC(rid);

	const audioCallOption = useMemo(() => {
		const handleJoinCall = (): void => {
			joinCall({ audio: true, video: false });
		};

		const handleStartCall = (): void => {
			startCall({ audio: true, video: false });
		};

		const action = callInProgress ? handleJoinCall : handleStartCall;

		return shouldAllowCalls
			? {
					label: t(callInProgress ? 'Join_audio_call' : 'Start_audio_call'),
					icon: 'mic',
					action,
			  }
			: undefined;
	}, [callInProgress, shouldAllowCalls, t, joinCall, startCall]);

	return audioCallOption;
};
