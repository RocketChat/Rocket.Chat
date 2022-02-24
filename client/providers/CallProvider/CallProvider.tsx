import { Random } from 'meteor/random';
import React, { useMemo, FC, useRef, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { OutgoingByeRequest } from 'sip.js/lib/core';

import { Notifications } from '../../../app/notifications/client';
import { IVoipRoom } from '../../../definition/IRoom';
import { WrapUpCallModal } from '../../components/voip/modal/WrapUpCallModal';
import { CallContext, CallContextValue } from '../../contexts/CallContext';
import { useSetModal } from '../../contexts/ModalContext';
import { useRoute } from '../../contexts/RouterContext';
import { useEndpoint } from '../../contexts/ServerContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useUser } from '../../contexts/UserContext';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { isUseVoipClientResultError, isUseVoipClientResultLoading, useVoipClient } from './hooks/useVoipClient';

export const CallProvider: FC = ({ children }) => {
	const voipEnabled = useSetting('VoIP_Enabled');

	const result = useVoipClient();

	const user = useUser();
	const homeRoute = useRoute('home');

	const remoteAudioMediaRef = useRef<HTMLAudioElement>(null); // TODO: Create a dedicated file for the AUDIO and make the controls accessible

	const AudioTagPortal: FC = ({ children }) => useMemo(() => createPortal(children, document.body), [children]);

	const dispatchToastMessage = useToastMessageDispatch();

	const [queueCounter, setQueueCounter] = useState('');

	const setModal = useSetModal();

	const openWrapUpModal = useCallback((): void => {
		setModal(<WrapUpCallModal />);
	}, [setModal]);

	const handleAgentCalled = useCallback(
		(queue: { queuename: string }): void => {
			dispatchToastMessage({
				type: 'success',
				message: `Received call in queue ${queue.queuename}`,
				options: {
					showDuration: '2000',
					hideDuration: '500',
					timeOut: '500',
				},
			});
		},
		[dispatchToastMessage],
	);

	const handleAgentConnected = useCallback((queue: { queuename: string; queuedcalls: string; waittimeinqueue: string }): void => {
		setQueueCounter(queue.queuedcalls);
	}, []);

	const handleMemberAdded = useCallback((queue: { queuename: string; queuedcalls: string }): void => {
		setQueueCounter(queue.queuedcalls);
	}, []);

	const handleMemberRemoved = useCallback((queue: { queuename: string; queuedcalls: string }): void => {
		setQueueCounter(queue.queuedcalls);
	}, []);

	const handleCallAbandon = useCallback((queue: { queuename: string; queuedcallafterabandon: string }): void => {
		setQueueCounter(queue.queuedcallafterabandon);
	}, []);

	const handleQueueJoined = useCallback(
		async (joiningDetails: { queuename: string; callerid: { id: string }; queuedcalls: string }): Promise<void> => {
			setQueueCounter(joiningDetails.queuedcalls);
		},
		[],
	);

	const handleCallHangup = useCallback(
		(_event: { roomId: string }) => {
			openWrapUpModal();
		},
		[openWrapUpModal],
	);

	useEffect(() => {
		const callNotificationEvents: Promise<() => void>[] = [];

		if (voipEnabled) {
			callNotificationEvents.push(Notifications.onUser('callerjoined', handleQueueJoined));
			callNotificationEvents.push(Notifications.onUser('agentcalled', handleAgentCalled));
			callNotificationEvents.push(Notifications.onUser('agentconnected', handleAgentConnected));
			callNotificationEvents.push(Notifications.onUser('queuememberadded', handleMemberAdded));
			callNotificationEvents.push(Notifications.onUser('queuememberremoved', handleMemberRemoved));
			callNotificationEvents.push(Notifications.onUser('callabandoned', handleCallAbandon));
			callNotificationEvents.push(Notifications.onUser('call.callerhangup', handleCallHangup));
		} else {
			callNotificationEvents.forEach(async (event) => {
				(await event)();
			});
			callNotificationEvents.length = 0;
		}
	}, [
		handleAgentCalled,
		handleQueueJoined,
		handleMemberAdded,
		handleMemberRemoved,
		handleCallAbandon,
		handleAgentConnected,
		handleCallHangup,
		voipEnabled,
	]);

	const visitorEndpoint = useEndpoint('POST', 'livechat/visitor');
	const voipEndpoint = useEndpoint('GET', 'voip/room');
	const voipCloseRoomEndpoint = useEndpoint('POST', 'voip/room.close');

	const [roomInfo, setRoomInfo] = useState<{ v: { token?: string }; rid: string }>();

	const contextValue: CallContextValue = useMemo(() => {
		if (!voipEnabled) {
			return {
				enabled: false,
				ready: false,
			};
		}

		if (isUseVoipClientResultError(result)) {
			return {
				enabled: true,
				ready: false,
				error: result.error,
			};
		}
		if (isUseVoipClientResultLoading(result)) {
			return {
				enabled: true,
				ready: false,
			};
		}

		const { registrationInfo, voipClient } = result;

		return {
			enabled: true,
			ready: true,
			openedRoomInfo: roomInfo,
			registrationInfo,
			voipClient,
			queueCounter,
			actions: {
				mute: (): Promise<void> => voipClient.muteCall(true), // voipClient.mute(),
				unmute: (): Promise<void> => voipClient.muteCall(false), // voipClient.unmute()
				pause: (): Promise<void> => voipClient.holdCall(true), // voipClient.pause()
				resume: (): Promise<void> => voipClient.holdCall(false), // voipClient.resume()
				end: (): Promise<OutgoingByeRequest | void> => voipClient.endCall(),
				pickUp: async (): Promise<void | null> =>
					remoteAudioMediaRef.current && voipClient.acceptCall({ remoteMediaElement: remoteAudioMediaRef.current }),
				reject: (): Promise<void> => voipClient.rejectCall(),
			},
			openRoom: async (caller): Promise<IVoipRoom['_id']> => {
				if (user) {
					const { visitor } = await visitorEndpoint({
						visitor: {
							token: Random.id(),
							phone: caller.callerId,
							name: caller.callerName || caller.callerId,
						},
					});
					const voipRoom = visitor && (await voipEndpoint({ token: visitor.token, agentId: user._id }));
					voipRoom.room && roomCoordinator.openRouteLink(voipRoom.room.t, { rid: voipRoom.room._id, name: voipRoom.room.name });
					voipRoom.room && setRoomInfo({ v: { token: voipRoom.room.v.token }, rid: voipRoom.room._id });
					return voipRoom.room._id;
				}

				return '';
			},
			closeRoom: async ({ comment, tags }): Promise<void> => {
				roomInfo && (await voipCloseRoomEndpoint({ rid: roomInfo.rid, token: roomInfo.v.token || '', comment, tags }));
				homeRoute.push({});
			},
			openWrapUpModal,
		};
	}, [queueCounter, voipEnabled, homeRoute, openWrapUpModal, result, roomInfo, user, visitorEndpoint, voipCloseRoomEndpoint, voipEndpoint]);

	return (
		<CallContext.Provider value={contextValue}>
			{children}
			{contextValue.enabled && (
				<AudioTagPortal>
					<audio ref={remoteAudioMediaRef} />
				</AudioTagPortal>
			)}
		</CallContext.Provider>
	);
};
