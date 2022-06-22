import { IRoom } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useState, ReactNode, useMemo, useEffect } from 'react';
import { Unsubscribe } from 'use-subscription';

import GenericModal from '../components/GenericModal';
import { VideoConfContext, VideoConfPopupPayload } from '../contexts/VideoConfContext';
import { VideoConfManager, DirectCallParams } from '../lib/VideoConfManager';
import VideoConfPopups from '../views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopups';

const VideoConfContextProvider = ({ children }: { children: ReactNode }): ReactElement => {
	const [outgoing, setOutgoing] = useState<VideoConfPopupPayload | undefined>();
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
			dispatchOutgoing: (option: Omit<VideoConfPopupPayload, 'id'>): void => setOutgoing({ ...option, id: option.rid }),
			dismissOutgoing: (): void => setOutgoing(undefined),
			startCall: (rid: IRoom['_id'], confTitle?: string): Promise<void> => VideoConfManager.startCall(rid, confTitle),
			acceptCall: (callId: string): void => VideoConfManager.acceptIncomingCall(callId),
			joinCall: (callId: string): Promise<void> => VideoConfManager.joinCall(callId),
			dismissCall: (callId: string): void => {
				VideoConfManager.dismissIncomingCall(callId);
			},
			rejectIncomingCall: (callId: string): void => VideoConfManager.rejectIncomingCall(callId),
			abortCall: (): void => VideoConfManager.abortCall(),
			setPreferences: (prefs: Partial<typeof VideoConfManager['preferences']>): void => VideoConfManager.setPreferences(prefs),
			changePreference: (key: 'cam' | 'mic', value: boolean): void => VideoConfManager.changePreference(key, value),
			queryIncomingCalls: {
				getCurrentValue: (): DirectCallParams[] => VideoConfManager.getIncomingDirectCalls(),
				subscribe: (cb: () => void): Unsubscribe => VideoConfManager.on('incoming/changed', cb),
			},
			queryRinging: {
				getCurrentValue: (): boolean => VideoConfManager.isRinging(),
				subscribe: (cb: () => void): Unsubscribe => VideoConfManager.on('ringing/changed', cb),
			},
			queryCalling: {
				getCurrentValue: (): boolean => VideoConfManager.isCalling(),
				subscribe: (cb: () => void): Unsubscribe => VideoConfManager.on('calling/changed', cb),
			},
		}),
		[],
	);

	return (
		<VideoConfContext.Provider value={contextValue}>
			{children}
			<VideoConfPopups>{outgoing}</VideoConfPopups>
		</VideoConfContext.Provider>
	);
};

export default VideoConfContextProvider;
