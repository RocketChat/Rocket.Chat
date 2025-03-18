import { useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import type { CandidateData, DescriptionData, JoinData } from '../../../../app/webrtc/client/WebRTCClass';
import { WebRTC } from '../../../../app/webrtc/client/WebRTCClass';

export const useWebRTC = () => {
	const uid = useUserId();
	const notifyUser = useStream('notify-user');

	useEffect(() => {
		if (!uid) return;

		const handleNotifyUser = (type: 'candidate' | 'description' | 'join', data: CandidateData | DescriptionData | JoinData) => {
			if (data.room == null) return;

			const webrtc = WebRTC.getInstanceByRoomId(data.room);

			if (!webrtc) return;

			const handleWebRTCTypeObject = {
				candidate: () => webrtc.onUserStream('candidate', data as CandidateData),
				description: () => webrtc.onUserStream('description', data as DescriptionData),
				join: () => webrtc.onUserStream('join', data as JoinData),
				default: () => console.warn(`WebRTC: Received unexpected event type: ${type}`),
			};

			(handleWebRTCTypeObject[type] || handleWebRTCTypeObject.default)();
		};

		const handleStopNotifyUser = notifyUser(`${uid}/webrtc`, handleNotifyUser);

		return () => {
			handleStopNotifyUser();
		};
	}, [notifyUser, uid]);
};
