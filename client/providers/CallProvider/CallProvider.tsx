import { Random } from 'meteor/random';
import React, { useMemo, FC, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { OutgoingByeRequest } from 'sip.js/lib/core';

import { Notifications } from '../../../app/notifications/client';
import { roomTypes } from '../../../app/utils/client';
import { APIClient } from '../../../app/utils/client/lib/RestApiClient';
import { CallContext, CallContextValue } from '../../contexts/CallContext';
import { useEndpoint } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useUser } from '../../contexts/UserContext';
import { isUseVoipClientResultError, isUseVoipClientResultLoading, useVoipClient } from './hooks/useVoipClient';

export const CallProvider: FC = ({ children }) => {
	// TODO: Test Settings and return false if its disabled (based on the settings)
	const result = useVoipClient();

	const user = useUser();

	const remoteAudioMediaRef = useRef<HTMLAudioElement>(null); // TODO: Create a dedicated file for the AUDIO and make the controls accessible

	const AudioTagPortal: FC = ({ children }) => useMemo(() => createPortal(children, document.body), [children]);

	const dispatchToastMessage = useToastMessageDispatch();

	const handleAgentCalled = useCallback(
		(queue: { queuename: string }): void => {
			dispatchToastMessage({
				type: 'success',
				message: `Received call in ${queue.queuename} `,
				options: {
					showDuration: '6000',
					hideDuration: '6000',
					timeOut: '50000',
				},
			});
		},
		[dispatchToastMessage],
	);

	const handleAgentConnected = useCallback(
		(queue: { queuename: string; queuedcalls: string }): void => {
			dispatchToastMessage({
				type: 'success',
				message: `Agent connected ${queue.queuename} queue count = ${queue.queuedcalls}`,
				options: {
					showDuration: '6000',
					hideDuration: '6000',
					timeOut: '50000',
				},
			});
		},
		[dispatchToastMessage],
	);

	const handleMemberAdded = useCallback(
		(queue: { queuename: string; queuedcalls: string }): void => {
			dispatchToastMessage({
				type: 'success',
				message: `Member added to ${queue.queuename} queue count = ${queue.queuedcalls}`,
				options: {
					showDuration: '6000',
					hideDuration: '6000',
					timeOut: '50000',
				},
			});
		},
		[dispatchToastMessage],
	);

	const handleMemberRemoved = useCallback(
		(queue: { queuename: string; queuedcalls: string }): void => {
			dispatchToastMessage({
				type: 'success',
				message: `Member removed from ${queue.queuename} queue count = ${queue.queuedcalls}`,
				options: {
					showDuration: '6000',
					hideDuration: '6000',
					timeOut: '50000',
				},
			});
		},
		[dispatchToastMessage],
	);

	const handleCallAbandon = useCallback(
		(queue: { queuename: string; queuedcallafterabandon: string }): void => {
			dispatchToastMessage({
				type: 'success',
				message: `Customer ababdoned queue ${queue.queuename} queue count = ${queue.queuedcallafterabandon}`,
				options: {
					showDuration: '6000',
					hideDuration: '6000',
					timeOut: '50000',
				},
			});
		},
		[dispatchToastMessage],
	);

	const handleQueueJoined = useCallback(
		async (joiningDetails: { queuename: string; callerid: { id: string } }): Promise<void> => {
			dispatchToastMessage({
				type: 'success',
				message: `Received call in ${joiningDetails.queuename} from customerid ${joiningDetails.callerid.id}`,
				options: {
					showDuration: '6000',
					hideDuration: '6000',
					timeOut: '50000',
				},
			});

			// TODO: can we change this to use a hook instead of the APIClient directly?
			const list = await APIClient.v1.get('voip/queues.getQueuedCallsForThisExtension', {
				extension: user?.extension,
			});

			dispatchToastMessage({
				type: 'success',
				message: `Calls waiting in ${joiningDetails.queuename} are ${list.callWaitingCount}`,
				options: {
					showDuration: '6000',
					hideDuration: '6000',
					timeOut: '50000',
				},
			});
		},
		[dispatchToastMessage, user?.extension],
	);

	useEffect(() => {
		if (!user) {
			return;
		}

		Notifications.onUser('callerjoined', handleQueueJoined);
		Notifications.onUser('agentcalled', handleAgentCalled);
		Notifications.onUser('agentconnected', handleAgentConnected);
		Notifications.onUser('queuememberadded', handleMemberAdded);
		Notifications.onUser('queuememberremoved', handleMemberRemoved);
		Notifications.onUser('callabandoned', handleCallAbandon);
	}, [user, handleAgentCalled, handleQueueJoined, handleMemberAdded, handleMemberRemoved, handleCallAbandon, handleAgentConnected]);

	const visitorEndpoint = useEndpoint('POST', 'livechat/visitor');
	const voipEndpoint = useEndpoint('GET', 'voip/room');

	const contextValue: CallContextValue = useMemo(() => {
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
			registrationInfo,
			voipClient,
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
			openRoom: async (caller): Promise<void> => {
				if (user) {
					const { visitor } = await visitorEndpoint({
						visitor: {
							token: Random.id(),
							phone: caller.callerId,
							name: caller.callerName || caller.callerId,
						},
					});
					const voipRoom = visitor && (await voipEndpoint({ token: visitor.token, agentId: user._id }));
					voipRoom.room && roomTypes.openRouteLink(voipRoom.room.t, voipRoom.room);
				}
			},
		};
	}, [result, user, visitorEndpoint, voipEndpoint]);
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
