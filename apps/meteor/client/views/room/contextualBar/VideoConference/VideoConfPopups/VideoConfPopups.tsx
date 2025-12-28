import { useCustomSound } from '@rocket.chat/ui-contexts';
import type { VideoConfPopupPayload } from '@rocket.chat/ui-video-conf';
import {
	VideoConfPopupBackdrop,
	useVideoConfIsCalling,
	useVideoConfIsRinging,
	useVideoConfIncomingCalls,
	VideoConfPopupSkeleton,
} from '@rocket.chat/ui-video-conf';
import type { ReactElement } from 'react';
import { lazy, Suspense, useEffect, useMemo } from 'react';
import { FocusScope } from 'react-aria';

import VideoConfPopupPortal from '../../../../../portals/VideoConfPopupPortal';

const VideoConfPopup = lazy(() => import('./VideoConfPopup'));

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
					{(children ? [children, ...popups] : popups).map(({ id, rid, isReceiving }, index = 1) => (
						<VideoConfPopupBackdrop key={id}>
							<Suspense fallback={<VideoConfPopupSkeleton />}>
								<FocusScope restoreFocus>
									<VideoConfPopup id={id} rid={rid} isReceiving={isReceiving} isCalling={isCalling} position={index * 10} />
								</FocusScope>
							</Suspense>
						</VideoConfPopupBackdrop>
					))}
				</VideoConfPopupPortal>
			)}
		</>
	);
};

export default VideoConfPopups;
