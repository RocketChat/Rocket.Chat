import { IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useCustomSound, useSetModal } from '@rocket.chat/ui-contexts';
import { VideoConfPopupBackdrop } from '@rocket.chat/ui-video-conf';
import React, { ReactElement, useState, ReactNode, useEffect, useMemo } from 'react';

import GenericModal from '../components/GenericModal';
import { VideoConfPopupContext, VideoConfIncomingCall, VideoConfPopupPayload } from '../contexts/VideoConfPopupContext';
import { useBlockedAction } from '../hooks/useBlockedAction';
import { VideoConfManager, useVideoConfIncomingCalls, useIsRinging } from '../lib/VideoConfManager';
import VideoConfPopupPortal from '../portals/VideoConfPopupPortal';
import VideoConfPopup from '../views/room/contextualBar/VideoConference/VideoConfPopup';

const VideoConfContextProvider = ({ children }: { children: ReactNode }): ReactElement => {
	const [outgoing, setOutgoing] = useState<VideoConfPopupPayload | undefined>();
	const incomingCalls = useVideoConfIncomingCalls();
	const customSound = useCustomSound();
	const isRinging = useIsRinging();

	const [simpleState, setSimpleState] = useState<{ url: string; callId: string }>();
	const setModal = useSetModal();

	// TODO: This is an experiemntal hook and behavior
	VideoConfManager.once('call/join', (props) => setSimpleState(props));
	const { isBlocked, handleRetry, setIsBlocked } = useBlockedAction({ url: simpleState?.url });

	const handleClose = useMutableCallback((): void => {
		setSimpleState(undefined);
		setIsBlocked(false);
		return setModal();
	});

	useEffect(() => {
		if (isBlocked) {
			return setModal(
				<GenericModal
					variant='warning'
					title='Action blocked'
					confirmText={'Open_again'}
					onConfirm={handleRetry}
					onCancel={handleClose}
					onClose={handleClose}
				>{`Your browser has blocked the page {PAGE}. <br/> Consider enable popups for this domain url`}</GenericModal>,
			);
		}
	}, [handleClose, isBlocked, handleRetry, setModal]);

	const contextValue = useMemo(
		() => ({
			dispatch: (option: Omit<VideoConfPopupPayload, 'id'>): void => setOutgoing({ ...option, id: option.rid }),
			dismiss: (): void => setOutgoing(undefined),
			startCall: (rid: IRoom['_id']): Promise<void> => VideoConfManager.startCall(rid),
			acceptCall: (callId: string): void => VideoConfManager.acceptIncomingCall(callId),
			joinCall: (callId: string): Promise<void> => VideoConfManager.joinCall(callId),
			dismissCall: (callId: string): void => {
				VideoConfManager.dismissIncomingCall(callId);
			},
			rejectIncomingCall: (callId: string): void => VideoConfManager.rejectIncomingCall(callId),
			abortCall: (): void => VideoConfManager.abortCall(),
			useIncomingCalls: (): VideoConfIncomingCall[] => useVideoConfIncomingCalls(),
			setPreferences: (prefs: Partial<typeof VideoConfManager['preferences']>): void => VideoConfManager.setPreferences(prefs),
			changePreference: (key: 'cam' | 'mic', value: boolean): void => VideoConfManager.changePreference(key, value),
			useIsRinging: (): boolean => useIsRinging(),
		}),
		[],
	);

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
		<VideoConfPopupContext.Provider value={contextValue}>
			{children}
			{(outgoing || popups?.length > 0) && (
				<VideoConfPopupPortal>
					<VideoConfPopupBackdrop>
						{(outgoing ? [outgoing, ...popups] : popups).map(({ id, rid, isReceiving }, index) => (
							<VideoConfPopup
								key={id}
								id={id}
								rid={rid}
								isReceiving={isReceiving}
								position={(index + 1) * 10}
								current={index}
								total={popups.length}
							/>
						))}
					</VideoConfPopupBackdrop>
				</VideoConfPopupPortal>
			)}
		</VideoConfPopupContext.Provider>
	);
};

export default VideoConfContextProvider;
