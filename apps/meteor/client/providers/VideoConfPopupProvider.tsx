import { IRoom } from '@rocket.chat/core-typings';
import { useCustomSound, useSetModal } from '@rocket.chat/ui-contexts';
import { VideoConfPopupBackdrop } from '@rocket.chat/ui-video-conf';
import React, { ReactElement, useState, ReactNode, useEffect, useMemo } from 'react';

import GenericModal from '../components/GenericModal';
import { VideoConfPopupContext, VideoConfIncomingCall, VideoConfPopupPayload } from '../contexts/VideoConfPopupContext';
import { VideoConfManager, useVideoConfIncomingCalls, useIsRinging } from '../lib/VideoConfManager';
import VideoConfPopupPortal from '../portals/VideoConfPopupPortal';
import VideoConfPopup from '../views/room/contextualBar/VideoConference/VideoConfPopup';

const VideoConfContextProvider = ({ children }: { children: ReactNode }): ReactElement => {
	const [outgoing, setOutgoing] = useState<VideoConfPopupPayload | undefined>();
	const incomingCalls = useVideoConfIncomingCalls();
	const customSound = useCustomSound();
	const isRinging = useIsRinging();

	const setModal = useSetModal();

	useEffect(
		() =>
			VideoConfManager.on('call/join', (props) => {
				const open = (): void => {
					const popup = window.open(props.url);

					if (popup !== null) {
						return;
					}

					setModal(
						<GenericModal
							variant='warning'
							title='Action blocked'
							confirmText={'Open_again'}
							onConfirm={open}
							onCancel={(): void => setModal()}
							onClose={(): void => setModal()}
						>{`Your browser has blocked the page {PAGE}. <br/> Consider enable popups for this domain url`}</GenericModal>,
					);
				};
				open();
			}),
		[setModal],
	);

	useEffect(() => VideoConfManager.on('direct/stopped', () => setOutgoing(undefined)), []);

	const contextValue = useMemo(
		() => ({
			dispatch: (option: Omit<VideoConfPopupPayload, 'id'>): void => setOutgoing({ ...option, id: option.rid }),
			startCall: (rid: IRoom['_id']): Promise<void> => VideoConfManager.startCall(rid),
			acceptCall: (callId: string): void => VideoConfManager.acceptIncomingCall(callId),
			joinCall: (callId: string): Promise<void> => VideoConfManager.joinCall(callId),
			dismissCall: (callId: string): void => {
				VideoConfManager.dismissIncomingCall(callId);
			},
			rejectIncomingCall: (callId: string): void => VideoConfManager.rejectIncomingCall(callId),
			abortCall: (): void => VideoConfManager.abortCall(),
			useIncomingCalls: (): VideoConfIncomingCall[] => useVideoConfIncomingCalls(),
			setPreferences: (preferences: Partial<typeof VideoConfManager['preferences']>): void => VideoConfManager.setPreferences(preferences),
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
