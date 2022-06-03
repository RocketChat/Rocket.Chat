import {
	IVoipRoom,
	IUser,
	VoipEventDataSignature,
	VoipClientEvents,
	ICallerInfo,
	isVoipEventAgentCalled,
	isVoipEventAgentConnected,
	isVoipEventCallerJoined,
	isVoipEventQueueMemberAdded,
	isVoipEventQueueMemberRemoved,
	isVoipEventCallAbandoned,
} from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useUser, useSetting, useEndpoint, useStream } from '@rocket.chat/ui-contexts';
import { Random } from 'meteor/random';
import React, { useMemo, FC, useRef, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { OutgoingByeRequest } from 'sip.js/lib/core';

import { CustomSounds } from '../../../app/custom-sounds/client';
import { getUserPreference } from '../../../app/utils/client';
import { WrapUpCallModal } from '../../components/voip/modal/WrapUpCallModal';
import { CallContext, CallContextValue } from '../../contexts/CallContext';
import { imperativeModal } from '../../lib/imperativeModal';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { QueueAggregator } from '../../lib/voip/QueueAggregator';
import { useVoipClient } from './hooks/useVoipClient';

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

type NetworkState = 'online' | 'offline';
export const CallProvider: FC = ({ children }) => {
	const voipEnabled = useSetting('VoIP_Enabled');
	const subscribeToNotifyUser = useStream('notify-user');
	const dispatchEvent = useEndpoint('POST', 'voip/events');

	const result = useVoipClient();
	const user = useUser();
	const homeRoute = useRoute('home');

	const remoteAudioMediaRef = useRef<HTMLAudioElement>(null); // TODO: Create a dedicated file for the AUDIO and make the controls accessible

	const [queueCounter, setQueueCounter] = useState(0);
	const [queueName, setQueueName] = useState('');

	const openWrapUpModal = useCallback((): void => {
		imperativeModal.open({ component: WrapUpCallModal });
	}, []);

	const [queueAggregator, setQueueAggregator] = useState<QueueAggregator>();

	const [networkStatus, setNetworkStatus] = useState<NetworkState>('online');

	useEffect(() => {
		if (!result?.voipClient) {
			return;
		}

		setQueueAggregator(result.voipClient.getAggregator());
	}, [result]);

	useEffect(() => {
		if (!voipEnabled || !user || !queueAggregator) {
			return;
		}

		const handleEventReceived = async (event: VoipEventDataSignature): Promise<void> => {
			if (isVoipEventAgentCalled(event)) {
				const { data } = event;
				queueAggregator.callRinging({ queuename: data.queue, callerid: data.callerId });
				setQueueName(queueAggregator.getCurrentQueueName());
				return;
			}
			if (isVoipEventAgentConnected(event)) {
				const { data } = event;
				queueAggregator.callPickedup({ queuename: data.queue, queuedcalls: data.queuedCalls, waittimeinqueue: data.waitTimeInQueue });
				setQueueName(queueAggregator.getCurrentQueueName());
				setQueueCounter(queueAggregator.getCallWaitingCount());
				return;
			}
			if (isVoipEventCallerJoined(event)) {
				const { data } = event;
				queueAggregator.queueJoined({ queuename: data.queue, callerid: data.callerId, queuedcalls: data.queuedCalls });
				setQueueCounter(queueAggregator.getCallWaitingCount());
				return;
			}
			if (isVoipEventQueueMemberAdded(event)) {
				const { data } = event;
				queueAggregator.memberAdded({ queuename: data.queue, queuedcalls: data.queuedCalls });
				setQueueName(queueAggregator.getCurrentQueueName());
				setQueueCounter(queueAggregator.getCallWaitingCount());
				return;
			}
			if (isVoipEventQueueMemberRemoved(event)) {
				const { data } = event;
				queueAggregator.memberRemoved({ queuename: data.queue, queuedcalls: data.queuedCalls });
				setQueueCounter(queueAggregator.getCallWaitingCount());
				return;
			}
			if (isVoipEventCallAbandoned(event)) {
				const { data } = event;
				queueAggregator.queueAbandoned({ queuename: data.queue, queuedcallafterabandon: data.queuedCallAfterAbandon });
				setQueueName(queueAggregator.getCurrentQueueName());
				setQueueCounter(queueAggregator.getCallWaitingCount());
				return;
			}

			console.warn('Unknown event received');
		};

		return subscribeToNotifyUser(`${user._id}/voip.events`, handleEventReceived);
	}, [subscribeToNotifyUser, user, queueAggregator, voipEnabled]);

	// This was causing event duplication before, so we'll leave this here for now
	useEffect(() => {
		if (!voipEnabled || !user || !queueAggregator) {
			return;
		}

		const handleCallHangup = (_event: { roomId: string }): void => {
			setQueueName(queueAggregator.getCurrentQueueName());
			openWrapUpModal();
			dispatchEvent({ event: VoipClientEvents['VOIP-CALL-ENDED'], rid: _event.roomId });
		};

		return subscribeToNotifyUser(`${user._id}/call.hangup`, handleCallHangup);
	}, [openWrapUpModal, queueAggregator, subscribeToNotifyUser, user, voipEnabled, dispatchEvent]);

	useEffect(() => {
		if (!result.voipClient) {
			return;
		}

		/*
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
	}, [result.voipClient]);

	const onNetworkConnected = useMutableCallback((): void => {
		if (!result.voipClient) {
			return;
		}
		if (networkStatus === 'offline') {
			setNetworkStatus('online');
		}
	});

	const onNetworkDisconnected = useMutableCallback((): void => {
		if (!result.voipClient) {
			return;
		}
		// Transitioning from online -> offline
		// If there is ongoing call, terminate it or if we are processing an incoming/outgoing call
		// reject it.
		if (networkStatus === 'online') {
			setNetworkStatus('offline');
			switch (result.voipClient.callerInfo.state) {
				case 'IN_CALL':
				case 'ON_HOLD':
					result.voipClient?.endCall();
					break;
				case 'OFFER_RECEIVED':
				case 'ANSWER_SENT':
					result.voipClient?.rejectCall();
					break;
			}
		}
	});

	useEffect(() => {
		if (!result.voipClient) {
			return;
		}
		result.voipClient.onNetworkEvent('connected', onNetworkConnected);
		result.voipClient.onNetworkEvent('disconnected', onNetworkDisconnected);
		result.voipClient.onNetworkEvent('connectionerror', onNetworkDisconnected);
		result.voipClient.onNetworkEvent('localnetworkonline', onNetworkConnected);
		result.voipClient.onNetworkEvent('localnetworkoffline', onNetworkDisconnected);

		return (): void => {
			result.voipClient?.offNetworkEvent('connected', onNetworkConnected);
			result.voipClient?.offNetworkEvent('disconnected', onNetworkDisconnected);
			result.voipClient?.offNetworkEvent('connectionerror', onNetworkDisconnected);
			result.voipClient?.offNetworkEvent('localnetworkonline', onNetworkConnected);
			result.voipClient?.offNetworkEvent('localnetworkoffline', onNetworkDisconnected);
		};
	}, [onNetworkConnected, onNetworkDisconnected, result.voipClient]);

	const visitorEndpoint = useEndpoint('POST', 'livechat/visitor');
	const voipEndpoint = useEndpoint('GET', 'voip/room');
	const voipCloseRoomEndpoint = useEndpoint('POST', 'voip/room.close');

	const [roomInfo, setRoomInfo] = useState<{ v: { token?: string }; rid: string }>();

	const openRoom = (rid: IVoipRoom['_id']): void => {
		roomCoordinator.openRouteLink('v', { rid });
	};

	const contextValue: CallContextValue = useMemo(() => {
		if (!voipEnabled) {
			return {
				enabled: false,
				ready: false,
			};
		}

		if (!user?.extension) {
			return {
				enabled: false,
				ready: false,
			};
		}

		if (result.error) {
			return {
				enabled: true,
				ready: false,
				error: result.error,
			};
		}

		if (!result.voipClient) {
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
			voipClient,
			registrationInfo,
			queueCounter,
			queueName,
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
			openRoom,
			createRoom: async (caller: ICallerInfo): Promise<IVoipRoom['_id']> => {
				if (user) {
					const { visitor } = await visitorEndpoint({
						visitor: {
							token: Random.id(),
							phone: caller.callerId,
							name: caller.callerName || caller.callerId,
						},
					});
					const voipRoom = visitor && (await voipEndpoint({ token: visitor.token, agentId: user._id }));
					openRoom(voipRoom.room._id);
					voipRoom.room && setRoomInfo({ v: { token: voipRoom.room.v.token }, rid: voipRoom.room._id });
					const queueAggregator = voipClient.getAggregator();
					if (queueAggregator) {
						queueAggregator.callStarted();
					}
					return voipRoom.room._id;
				}
				return '';
			},
			closeRoom: async (data?: { comment: string; tags: string[] }): Promise<void> => {
				roomInfo &&
					(await voipCloseRoomEndpoint({
						rid: roomInfo.rid,
						token: roomInfo.v.token || '',
						comment: data?.comment || '',
						tags: data?.tags,
					}));
				homeRoute.push({});
				const queueAggregator = voipClient.getAggregator();
				if (queueAggregator) {
					queueAggregator.callEnded();
				}
			},
			openWrapUpModal,
		};
	}, [
		voipEnabled,
		user,
		result,
		roomInfo,
		queueCounter,
		queueName,
		openWrapUpModal,
		visitorEndpoint,
		voipEndpoint,
		voipCloseRoomEndpoint,
		homeRoute,
	]);

	return (
		<CallContext.Provider value={contextValue}>
			{children}
			{contextValue.enabled && createPortal(<audio ref={remoteAudioMediaRef} />, document.body)}
		</CallContext.Provider>
	);
};
