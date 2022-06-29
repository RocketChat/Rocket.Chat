import { IRoom } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { Action } from '../../../../hooks/useActionSpread';
import { useWebRTC } from '../../useWebRTC';

export const useVideoCallAction = (rid: IRoom['_id']): Action | undefined => {
	const t = useTranslation();
	const { shouldAllowCalls, callInProgress, joinCall, startCall } = useWebRTC(rid);

	const videoCallOption = useMemo(() => {
		const handleJoinCall = (): void => {
			joinCall({ audio: true, video: true });
		};

		const handleStartCall = (): void => {
			startCall({ audio: true, video: true });
		};

		const action = callInProgress ? handleJoinCall : handleStartCall;

		return shouldAllowCalls
			? {
					label: t(callInProgress ? 'Join_video_call' : 'Start_video_call'),
					icon: 'video',
					action,
			  }
			: undefined;
	}, [callInProgress, shouldAllowCalls, t, joinCall, startCall]);

	return videoCallOption;
};
