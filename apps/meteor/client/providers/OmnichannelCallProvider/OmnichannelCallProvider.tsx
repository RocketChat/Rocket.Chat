import type { IVoipRoom, VoipEventDataSignature, ICallerInfo, ICallDetails, ILivechatVisitor, Serialized } from '@rocket.chat/core-typings';
import {
	VoipClientEvents,
	isVoipEventAgentCalled,
	isVoipEventAgentConnected,
	isVoipEventCallerJoined,
	isVoipEventQueueMemberAdded,
	isVoipEventQueueMemberRemoved,
	isVoipEventCallAbandoned,
	UserState,
} from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Random } from '@rocket.chat/random';
import type { Device, IExperimentalHTMLAudioElement } from '@rocket.chat/ui-contexts';
import {
	useRouter,
	useUser,
	useSetting,
	useEndpoint,
	useStream,
	useSetOutputMediaDevice,
	useSetInputMediaDevice,
	useSetModal,
	useTranslation,
} from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { OutgoingByeRequest } from 'sip.js/lib/core';

import { isOutboundClient, useOmnichannelVoipClient } from '../../../ee/client/hooks/useOmnichannelVoipClient';
import { WrapUpCallModal } from '../../../ee/client/voip/components/modals/WrapUpCallModal';
import type { CallContextValue } from '../../contexts/OmnichannelCallContext';
import { CallContext, useIsVoipEnterprise } from '../../contexts/OmnichannelCallContext';
import { useDialModal } from '../../hooks/useDialModal';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import type { QueueAggregator } from '../../lib/voip/QueueAggregator';
import { parseOutboundPhoneNumber } from '../../lib/voip/parseOutboundPhoneNumber';
import { useVoipSounds } from './hooks/useVoipSounds';

type NetworkState = 'online' | 'offline';

const OmnichannelCallProvider: FC = ({ children }) => {
	const [clientState, setClientState] = useState<'registered' | 'unregistered'>('unregistered');

	const voipEnabled = useSetting('VoIP_Enabled');
	const subscribeToNotifyUser = useStream('notify-user');
	const dispatchEvent = useEndpoint('POST', '/v1/voip/events');
	const visitorEndpoint = useEndpoint('POST', '/v1/livechat/visitor');
	const voipEndpoint = useEndpoint('GET', '/v1/voip/room');
	const voipCloseRoomEndpoint = useEndpoint('POST', '/v1/voip/room.close');
	const getContactBy = useEndpoint('GET', '/v1/omnichannel/contact.search');
	const setModal = useSetModal();
	const t = useTranslation();

	const result = useOmnichannelVoipClient();
	const user = useUser();
	const router = useRouter();
	const setOutputMediaDevice = useSetOutputMediaDevice();
	const setInputMediaDevice = useSetInputMediaDevice();

	const hasVoIPEnterpriseLicense = useIsVoipEnterprise();

	const remoteAudioMediaRef = useRef<IExperimentalHTMLAudioElement>(null); // TODO: Create a dedicated file for the AUDIO and make the controls accessible

	const [queueCounter, setQueueCounter] = useState(0);
	const [queueName, setQueueName] = useState('');
	const [roomInfo, setRoomInfo] = useState<{ v: { token?: string }; rid: string }>({ v: {}, rid: '' });

	const { openDialModal } = useDialModal();

	const voipSounds = useVoipSounds();

	const [queueAggregator, setQueueAggregator] = useState<QueueAggregator>();

	const [networkStatus, setNetworkStatus] = useState<NetworkState>('online');

	const closeRoom = useCallback(
		async (data = {}): Promise<void> => {
			roomInfo &&
				(await voipCloseRoomEndpoint({
					rid: roomInfo.rid,
					token: roomInfo.v.token || '',
					options: { comment: data?.comment, tags: data?.tags },
				}));
			router.navigate('/home');

			const queueAggregator = result.voipClient?.getAggregator();
			if (queueAggregator) {
				queueAggregator.callEnded();
			}
		},
		[router, result?.voipClient, roomInfo, voipCloseRoomEndpoint],
	);

	const openWrapUpModal = useCallback((): void => {
		setModal(() => <WrapUpCallModal closeRoom={closeRoom} />);
	}, [closeRoom, setModal]);

	const changeAudioOutputDevice = useMutableCallback((selectedAudioDevice: Device): void => {
		remoteAudioMediaRef?.current &&
			setOutputMediaDevice({ outputDevice: selectedAudioDevice, HTMLAudioElement: remoteAudioMediaRef.current });
	});

	const changeAudioInputDevice = useMutableCallback((selectedAudioDevice: Device): void => {
		if (!result.voipClient) {
			return;
		}
		const constraints = { audio: { deviceId: { exact: selectedAudioDevice.id } } };

		// TODO: Migrate the classes that manage MediaStream to a more react based approach (using contexts/providers perhaps)
		// For now the MediaStream management is very coupled with the VoIP client,
		// decoupling it will make it usable by other areas of the project that needs to handle MediaStreams and avoid code duplication
		result.voipClient.changeAudioInputDevice(constraints);

		setInputMediaDevice(selectedAudioDevice);
	});

	const openRoom = useCallback((rid: IVoipRoom['_id']): void => {
		roomCoordinator.openRouteLink('v', { rid });
	}, []);

	const findOrCreateVisitor = useCallback(
		async (caller: ICallerInfo): Promise<Serialized<ILivechatVisitor>> => {
			const phone = parseOutboundPhoneNumber(caller.callerId);

			const { contact } = await getContactBy({ phone });

			if (contact) {
				return contact;
			}

			const { visitor } = await visitorEndpoint({
				visitor: {
					token: Random.id(),
					phone,
					name: caller.callerName || phone,
				},
			});

			return visitor;
		},
		[getContactBy, visitorEndpoint],
	);

	const createRoom = useCallback(
		async (caller: ICallerInfo, direction: IVoipRoom['direction'] = 'inbound'): Promise<IVoipRoom['_id']> => {
			if (!user) {
				return '';
			}
			try {
				const visitor = await findOrCreateVisitor(caller);
				const voipRoom = await voipEndpoint({ token: visitor.token, agentId: user._id, direction });
				openRoom(voipRoom.room._id);
				voipRoom.room && setRoomInfo({ v: { token: voipRoom.room.v.token }, rid: voipRoom.room._id });
				const queueAggregator = result.voipClient?.getAggregator();
				if (queueAggregator) {
					queueAggregator.callStarted();
				}
				return voipRoom.room._id;
			} catch (error) {
				console.error(`Error while creating a visitor ${error}`);
				return '';
			}
		},
		[openRoom, result.voipClient, user, voipEndpoint, findOrCreateVisitor],
	);

	useEffect(() => {
		const { voipClient } = result || {};

		if (!voipClient) {
			return;
		}

		setQueueAggregator(voipClient.getAggregator());

		return (): void => {
			if (clientState === 'registered') {
				return voipClient.unregister();
			}
		};
	}, [result, clientState]);

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

		return subscribeToNotifyUser(`${user._id}/call.hangup`, (event): void => {
			setQueueName(queueAggregator.getCurrentQueueName());

			if (hasVoIPEnterpriseLicense) {
				openWrapUpModal();
				return;
			}

			closeRoom();

			dispatchEvent({ event: VoipClientEvents['VOIP-CALL-ENDED'], rid: event.roomId });
		});
	}, [openWrapUpModal, queueAggregator, subscribeToNotifyUser, user, voipEnabled, dispatchEvent, hasVoIPEnterpriseLicense, closeRoom]);

	useEffect(() => {
		if (!result.voipClient) {
			return;
		}

		const offRegistered = result.voipClient.on('registered', (): void => setClientState('registered'));
		const offUnregistered = result.voipClient.on('unregistered', (): void => setClientState('unregistered'));

		return (): void => {
			offRegistered();
			offUnregistered();
		};
	}, [result.voipClient]);

	useEffect(() => {
		if (!result.voipClient) {
			return;
		}

		/*
		 * This code may need a revisit when we handle callinqueue differently.
		 * Check clickup tasks for more details
		 * https://app.clickup.com/t/22hy1k4
		 * When customer called a queue (Either using skype or using internal number), call would get established
		 * customer would hear agent's voice but agent would not hear anything from customer.
		 * This issue was observed on unstable. It was found to be inconsistent to reproduce.
		 * On some developer env, it would happen randomly. On Safari it did not happen if
		 * user refreshes before taking every call.
		 *
		 * The reason behind this was as soon as agent accepts a call, queueCounter would change.
		 * This change will trigger re-rendering of media and creation of audio element.
		 * This audio element gets used by voipClient to render the remote audio.
		 * Because the re-render happened, it would hold a stale reference.
		 *
		 * If the dom is inspected, audio element just before body is usually created by this class.
		 * this audio element.srcObject contains null value. In working case, it should display
		 * valid stream object.
		 *
		 * Reason for inconsistencies :
		 * This element is utilized in VoIPUser::setupRemoteMedia
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

	useEffect(() => {
		if (!result.voipClient) {
			return;
		}

		if (!user) {
			return;
		}

		const onCallEstablished = async (callDetails: ICallDetails): Promise<undefined> => {
			if (!callDetails.callInfo) {
				return;
			}

			voipSounds.stopAll();

			if (callDetails.userState !== UserState.UAC) {
				return;
			}
			// Agent has sent Invite. So it must create a room.
			const { callInfo } = callDetails;
			// While making the call, there is no remote media element available.
			// When the call is ringing we have that element created. But we still
			// do not want it to be attached.
			// When call gets established, then switch the media renderer.
			remoteAudioMediaRef.current && result.voipClient?.switchMediaRenderer({ remoteMediaElement: remoteAudioMediaRef.current });
			const roomId = await createRoom(callInfo, 'outbound');
			dispatchEvent({ event: VoipClientEvents['VOIP-CALL-STARTED'], rid: roomId });
		};

		const onNetworkConnected = (): void => {
			if (networkStatus === 'offline') {
				setNetworkStatus('online');
			}
		};

		const onNetworkDisconnected = (): void => {
			// Transitioning from online -> offline
			// If there is ongoing call, terminate it or if we are processing an incoming/outgoing call
			// reject it.
			if (networkStatus === 'online') {
				setNetworkStatus('offline');
				switch (result.voipClient?.callerInfo.state) {
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
		};

		const onRinging = (): void => {
			voipSounds.play('outbound-call-ringing');
		};

		const onIncomingCallRinging = (): void => {
			voipSounds.play('telephone');
		};

		const onCallTerminated = (): void => {
			voipSounds.play('call-ended', false);
			voipSounds.stopAll();
		};

		const onCallFailed = (reason: 'Not Found' | 'Address Incomplete' | 'Request Terminated' | string): void => {
			switch (reason) {
				case 'Not Found':
					// This happens when the call matches dialplan and goes to the world, but the trunk doesnt find the number.
					openDialModal({ errorMessage: t('Dialed_number_doesnt_exist') });
					break;
				case 'Address Incomplete':
					// This happens when the dialed number doesnt match a valid asterisk dialplan pattern or the number is invalid.
					openDialModal({ errorMessage: t('Dialed_number_is_incomplete') });
					break;
				case 'Request Terminated':
					break;
				default:
					openDialModal({ errorMessage: t('Something_went_wrong_try_again_later') });
			}
		};

		result.voipClient.onNetworkEvent('connected', onNetworkConnected);
		result.voipClient.onNetworkEvent('disconnected', onNetworkDisconnected);
		result.voipClient.onNetworkEvent('connectionerror', onNetworkDisconnected);
		result.voipClient.onNetworkEvent('localnetworkonline', onNetworkConnected);
		result.voipClient.onNetworkEvent('localnetworkoffline', onNetworkDisconnected);
		result.voipClient.on('callestablished', onCallEstablished);
		result.voipClient.on('ringing', onRinging); // not called for incoming call
		result.voipClient.on('incomingcall', onIncomingCallRinging);
		result.voipClient.on('callterminated', onCallTerminated);

		if (isOutboundClient(result.voipClient)) {
			result.voipClient.on('callfailed', onCallFailed);
		}

		return (): void => {
			result.voipClient?.offNetworkEvent('connected', onNetworkConnected);
			result.voipClient?.offNetworkEvent('disconnected', onNetworkDisconnected);
			result.voipClient?.offNetworkEvent('connectionerror', onNetworkDisconnected);
			result.voipClient?.offNetworkEvent('localnetworkonline', onNetworkConnected);
			result.voipClient?.offNetworkEvent('localnetworkoffline', onNetworkDisconnected);
			result.voipClient?.off('incomingcall', onIncomingCallRinging);
			result.voipClient?.off('ringing', onRinging);
			result.voipClient?.off('callestablished', onCallEstablished);
			result.voipClient?.off('callterminated', onCallTerminated);

			if (isOutboundClient(result.voipClient)) {
				result.voipClient?.off('callfailed', onCallFailed);
			}
		};
	}, [createRoom, dispatchEvent, networkStatus, openDialModal, result.voipClient, voipSounds, t, user]);

	const contextValue: CallContextValue = useMemo(() => {
		if (!voipEnabled) {
			return {
				enabled: false,
				ready: false,
				outBoundCallsAllowed: undefined, // set to true only if enterprise license is present.
				outBoundCallsEnabled: undefined, // set to true even if enterprise license is not present.
				outBoundCallsEnabledForUser: undefined, // set to true if the user has enterprise license, but is not able to make outbound calls. (busy, or disabled)
			};
		}

		if (!user?.extension) {
			return {
				enabled: false,
				ready: false,
				outBoundCallsAllowed: undefined, // set to true only if enterprise license is present.
				outBoundCallsEnabled: undefined, // set to true even if enterprise license is not present.
				outBoundCallsEnabledForUser: undefined, // set to true if the user has enterprise license, but is not able to make outbound calls. (busy, or disabled)
			};
		}

		if (result.error) {
			return {
				enabled: true,
				ready: false,
				error: result.error,
				outBoundCallsAllowed: undefined, // set to true only if enterprise license is present.
				outBoundCallsEnabled: undefined, // set to true even if enterprise license is not present.
				outBoundCallsEnabledForUser: undefined, // set to true if the user has enterprise license, but is not able to make outbound calls. (busy, or disabled)
			};
		}

		if (!result.voipClient) {
			return {
				enabled: true,
				ready: false,
				outBoundCallsAllowed: undefined, // set to true only if enterprise license is present.
				outBoundCallsEnabled: undefined, // set to true even if enterprise license is not present.
				outBoundCallsEnabledForUser: undefined, // set to true if the user has enterprise license, but is not able to make outbound calls. (busy, or disabled)
			};
		}

		const { registrationInfo, voipClient } = result;

		return {
			outBoundCallsAllowed: hasVoIPEnterpriseLicense, // set to true only if enterprise license is present.
			outBoundCallsEnabled: hasVoIPEnterpriseLicense, // set to true even if enterprise license is not present.
			outBoundCallsEnabledForUser:
				hasVoIPEnterpriseLicense && clientState === 'registered' && !['IN_CALL', 'ON_HOLD'].includes(voipClient.callerInfo.state), // set to true if the user has enterprise license, but is not able to make outbound calls. (busy, or disabled)

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
			createRoom,
			closeRoom,
			networkStatus,
			openWrapUpModal,
			changeAudioOutputDevice,
			changeAudioInputDevice,
			register: (): void => voipClient.register(),
			unregister: (): void => voipClient.unregister(),
		};
	}, [
		voipEnabled,
		user?.extension,
		result,
		hasVoIPEnterpriseLicense,
		clientState,
		roomInfo,
		queueCounter,
		queueName,
		openRoom,
		createRoom,
		closeRoom,
		openWrapUpModal,
		changeAudioOutputDevice,
		changeAudioInputDevice,
		networkStatus,
	]);

	return (
		<CallContext.Provider value={contextValue}>
			{children}
			{contextValue.enabled &&
				createPortal(
					<audio ref={remoteAudioMediaRef}>
						<track kind='captions' />
					</audio>,
					document.body,
				)}
		</CallContext.Provider>
	);
};

export default OmnichannelCallProvider;
