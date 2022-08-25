import { useCustomSound } from '@rocket.chat/ui-contexts';
import { VideoConfPopupBackdrop } from '@rocket.chat/ui-video-conf';
import React, { ReactElement, useEffect, useMemo } from 'react';

import {
	VideoConfPopupPayload,
	useVideoConfIsCalling,
	useVideoConfIsRinging,
	useVideoConfIncomingCalls,
} from '../../../../../contexts/VideoConfContext';
import VideoConfPopupPortal from '../../../../../portals/VideoConfPopupPortal';
import VideoConfPopup from './VideoConfPopup';

const VideoConfPopups = ({ children }: { children?: VideoConfPopupPayload }): ReactElement => {
	const customSound = useCustomSound();
	const incomingCalls = useVideoConfIncomingCalls();
	const isRinging = useVideoConfIsRinging();
	const isCalling = useVideoConfIsCalling();

	const popups = useMemo(
		() =>
			incomingCalls
				.filter((incomingCall) => !incomingCall.dismissed)
				.map((incomingCall) => ({ id: incomingCall.callId, rid: incomingCall.rid, isReceiving: true })),
		[incomingCalls],
	);

	useEffect(() => {
		if (isRinging) {
			customSound.play('ringtone', { loop: true });
		}

		if (isCalling) {
			customSound.play('dialtone', { loop: true });
		}

		return (): void => {
			customSound.pause('ringtone');
			customSound.pause('dialtone');
		};
	}, [customSound, isRinging, isCalling]);

	return (
		<>
			{(children || popups?.length > 0) && (
				<VideoConfPopupPortal>
					<VideoConfPopupBackdrop>
						{(children ? [children, ...popups] : popups).map(({ id, rid, isReceiving }, index = 1) => (
							<VideoConfPopup key={id} id={id} rid={rid} isReceiving={isReceiving} isCalling={isCalling} position={index * 10} />
						))}
					</VideoConfPopupBackdrop>
				</VideoConfPopupPortal>
			)}
		</>
	);
};

export default VideoConfPopups;
