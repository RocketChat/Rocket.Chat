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
	const incomingCalls = useVideoConfIncomingCalls();
	const customSound = useCustomSound();
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
			customSound.play('calling');
			const soundInterval = setInterval(() => {
				customSound.play('calling');
			}, 3000);

			return (): void => {
				customSound.pause('calling');
				clearInterval(soundInterval);
			};
		}
	}, [customSound, isRinging]);

	return (
		<>
			{(children || popups?.length > 0) && (
				<VideoConfPopupPortal>
					<VideoConfPopupBackdrop>
						{(children ? [children, ...popups] : popups).map(({ id, rid, isReceiving }, index) => (
							<VideoConfPopup
								key={id}
								id={id}
								rid={rid}
								isReceiving={isReceiving}
								isCalling={isCalling}
								position={(index + 1) * 10}
								current={index}
								total={popups.length}
							/>
						))}
					</VideoConfPopupBackdrop>
				</VideoConfPopupPortal>
			)}
		</>
	);
};

export default VideoConfPopups;
