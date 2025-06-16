import { useCustomSound } from '@rocket.chat/ui-contexts';
import type { VideoConfPopupPayload } from '@rocket.chat/ui-video-conf';
import {
	VideoConfPopupBackdrop,
	useVideoConfIsCalling,
	useVideoConfIsRinging,
	useVideoConfIncomingCalls,
} from '@rocket.chat/ui-video-conf';
import type { ReactElement } from 'react';
import { useEffect, useMemo } from 'react';
import { FocusScope } from 'react-aria';

import VideoConfPopup from './VideoConfPopup';
import VideoConfPopupPortal from '../../../../../portals/VideoConfPopupPortal';

const VideoConfPopups = ({ children }: { children?: VideoConfPopupPayload }): ReactElement => {
	const { callSounds } = useCustomSound();
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
			callSounds.playRinger();
		}

		if (isCalling) {
			callSounds.playDialer();
		}

		return (): void => {
			callSounds.stopRinger();
			callSounds.stopDialer();
		};
	}, [isRinging, isCalling, callSounds]);

	return (
		<>
			{(children || popups?.length > 0) && (
				<VideoConfPopupPortal>
					<FocusScope autoFocus contain restoreFocus>
						<VideoConfPopupBackdrop>
							{(children ? [children, ...popups] : popups).map(({ id, rid, isReceiving }, index = 1) => (
								<VideoConfPopup key={id} id={id} rid={rid} isReceiving={isReceiving} isCalling={isCalling} position={index * 10} />
							))}
						</VideoConfPopupBackdrop>
					</FocusScope>
				</VideoConfPopupPortal>
			)}
		</>
	);
};

export default VideoConfPopups;
