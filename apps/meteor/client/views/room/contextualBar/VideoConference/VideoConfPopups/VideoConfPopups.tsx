import { FocusScope } from '@react-aria/focus';
import { useCustomSound } from '@rocket.chat/ui-contexts';
import type { VideoConfPopupPayload } from '@rocket.chat/ui-video-conf';
import {
	VideoConfPopupBackdrop,
	useVideoConfIsCalling,
	useVideoConfIsRinging,
	useVideoConfIncomingCalls,
	VideoConfPopupSkeleton,
} from '@rocket.chat/ui-video-conf';
import { lazy, Suspense, useEffect, useMemo } from 'react';

import VideoConfPopupPortal from '../../../../../portals/VideoConfPopupPortal';
import { useConferenceWindowEnabled } from '../../../../conference/hooks/useConferenceWindowEnabled';

const VideoConfPopup = lazy(() => import('./VideoConfPopup'));

export type VideoConfPopupsProps = { children?: VideoConfPopupPayload };

const VideoConfPopups = ({ children }: VideoConfPopupsProps) => {
	const { callSounds } = useCustomSound();
	const incomingCalls = useVideoConfIncomingCalls();
	const isRinging = useVideoConfIsRinging();
	const isCalling = useVideoConfIsCalling();

	// An incoming call is listed with the others — docked in the sidebar, or behind the navbar button — instead of
	// taking over the screen. The ring still sounds; it just no longer demands an answer before anything else can
	// happen. Without that list there is nowhere else for a call to be announced, so the popup stays.
	const listedInsteadOfPopped = useConferenceWindowEnabled();

	const popups = useMemo(
		() =>
			listedInsteadOfPopped
				? []
				: incomingCalls
						.filter((incomingCall) => !incomingCall.dismissed)
						.map((incomingCall) => ({ id: incomingCall.callId, rid: incomingCall.rid, isReceiving: true })),
		[incomingCalls, listedInsteadOfPopped],
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
