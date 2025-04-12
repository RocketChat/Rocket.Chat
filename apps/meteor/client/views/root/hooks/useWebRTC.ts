import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import type { CandidateData, DescriptionData, JoinData } from '../../../../app/webrtc/client/WebRTCClass';
import { WebRTC } from '../../../../app/webrtc/client/WebRTCClass';
import { WEB_RTC_EVENTS } from '../../../../app/webrtc/lib/constants';

export const useWebRTC = (uid: string) => {
	const notifyUser = useStream('notify-user');

	useEffect(() => {
		const handleNotifyUser = (type: 'candidate' | 'description' | 'join', data: CandidateData | DescriptionData | JoinData) => {
			if (data.room == null) return;

			const webrtc = WebRTC.getInstanceByRoomId(data.room);

			if (!webrtc) return;

			switch (type) {
				case 'candidate':
					webrtc.onUserStream('candidate', data as CandidateData);
					break;
				case 'description':
					webrtc.onUserStream('description', data as DescriptionData);
					break;
				case 'join':
					webrtc.onUserStream('join', data as JoinData);
					break;
				default:
					console.warn(`WebRTC: Received unexpected event type: ${type}`);
			}
		};

		return notifyUser(`${uid}/${WEB_RTC_EVENTS.WEB_RTC}`, handleNotifyUser);
	}, [notifyUser, uid]);
};
