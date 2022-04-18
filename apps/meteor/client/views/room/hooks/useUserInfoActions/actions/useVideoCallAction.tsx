import { IRoom } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import { useMemo, ComponentProps } from 'react';

import { useTranslation } from '../../../../../contexts/TranslationContext';
import { Action } from '../../../../hooks/useActionSpread';
import { useWebRTC } from '../../useWebRTC';

export const useVideoCallAction = (rid: IRoom['_id']): Action | false => {
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

		return (
			shouldAllowCalls && {
				label: t(callInProgress ? 'Join_video_call' : 'Start_video_call'),
				icon: 'video' as ComponentProps<typeof Icon>,
				action,
			}
		);
	}, [callInProgress, shouldAllowCalls, t, joinCall, startCall]);

	return videoCallOption;
};
