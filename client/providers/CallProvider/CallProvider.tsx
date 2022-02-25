import { Random } from 'meteor/random';
import React, { useMemo, FC, useRef, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { OutgoingByeRequest } from 'sip.js/lib/core';

import { CustomSounds } from '../../../app/custom-sounds/client';
import { Notifications } from '../../../app/notifications/client';
import { getUserPreference } from '../../../app/utils/client';
import { IVoipRoom } from '../../../definition/IRoom';
import { IUser } from '../../../definition/IUser';
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

const startRingback = (user: IUser): void => {
	const audioVolume = getUserPreference(user, 'notificationsSoundVolume');
	CustomSounds.play('telephone', {
		volume: Number((audioVolume / 100).toPrecision(2)),
		loop: true,
	});
};

const stopRingback = (): void => {
	CustomSounds.pause('telephone');
	CustomSounds.remove('telephone');
};

export const CallProvider: FC = ({ children }) => {
	const voipEnabled = useSetting('VoIP_Enabled');

	// TODO: Test Settings and return false if its disabled (based on the settings)
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
		Notifications.onUser('callerjoined', handleQueueJoined);
		Notifications.onUser('agentcalled', handleAgentCalled);
		Notifications.onUser('agentconnected', handleAgentConnected);
		Notifications.onUser('queuememberadded', handleMemberAdded);
		Notifications.onUser('queuememberremoved', handleMemberRemoved);
		Notifications.onUser('callabandoned', handleCallAbandon);
		Notifications.onUser('call.callerhangup', handleCallHangup);
	}, [
		handleAgentCalled,
		handleQueueJoined,
		handleMemberAdded,
		handleMemberRemoved,
		handleCallAbandon,
		handleAgentConnected,
		handleCallHangup,
	]);

	useEffect(() => {
		if (isUseVoipClientResultError(result)) {
			return;
		}

		if (isUseVoipClientResultLoading(result)) {
			return;
		}
		/**
		 * This code may need a revisit when we handle callinqueue differently.
		 * Check clickup taks for more details
		 * https://app.clickup.com/t/22hy1k4
		 * When customer called a queue (Either using skype or using internal number), call would get established
		 * customer would hear agent's voice but agent would not hear anything from customer.
		 * This issue was observed on unstable. It was found to be incosistent to reproduce.
		 * On some developer env, it would happen randomly. On Safari it did not happen if
		 * user refreshes before taking every call.
		 *
		 * The reason behind this was as soon as agent accepts a call, queueCounter would change.
		 * This change will trigger re-rendering of media and creation of audio element.
		 * This audio element gets used by voipClient to render the remote audio.
		 * Because the re-render happend, it would hold a stale reference.
		 *
		 * If the dom is inspected, audio element just before body is usually created by this class.
		 * this audio element.srcObject contains null value. In working case, it should display
		 * valid stream object.
		 *
		 * Reason for inconsistecies :
		 * This element is utilised in VoIPUser::setupRemoteMedia
		 * This function is called when webRTC receives a remote track event. i.e when the webrtc's peer connection
		 * starts receiving media. This event call back depends on several factors. How does asterisk setup streams.
		 * How does it creates a bridge which patches up the agent and customer (Media is flowing thru asterisk).
		 * When it works in de-environment, it was observed that the audio element in dom and the audio element hold
		 * by VoIPUser is different. Nonetheless, this stale audio element holds valid media stream, which is being played.
		 * Hence sometimes the audio is heard.
		 *
		 * Ideally call component once gets stable, should not get rerendered. Queue, Room creation are the parameters
		 * which should be independent and should not control the call component.
		 *
		 * Solution :
		 * Either make the audio elemenent rendered independent of rest of the DOM.
		 * or implement useEffect. This useEffect will reset the rendering elements with the latest audio tag.
		 *
		 * Note : If this code gets refactor, revisit the line below to check if this call is needed.
		 *
		 */
		remoteAudioMediaRef.current && result.voipClient.switchMediaRenderer({ remoteMediaElement: remoteAudioMediaRef.current });
	});

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

		voipClient.on('incomingcall', () => user && startRingback(user));
		voipClient.on('callestablished', () => stopRingback());
		voipClient.on('callterminated', () => stopRingback());

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
