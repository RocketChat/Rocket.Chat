import React, { useMemo, FC, useRef } from 'react';
import { createPortal } from 'react-dom';
import { OutgoingByeRequest } from 'sip.js/lib/core';

import { Notifications } from '../../../app/notifications/client';
import { APIClient } from '../../../app/utils/client/lib/RestApiClient';
import { CallContext, CallContextValue } from '../../contexts/CallContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { isUseVoipClientResultError, isUseVoipClientResultLoading, useVoipClient } from './hooks/useVoipClient';

export const CallProvider: FC = ({ children }) => {
	// TODO: Test Settings and return false if its disabled (based on the settings)
	const result = useVoipClient();

	const remoteAudioMediaRef = useRef<HTMLAudioElement>(null); // TODO: Create a dedicated file for the AUDIO and make the controls accessible

	const AudioTagPortal: FC = ({ children }) => useMemo(() => createPortal(children, document.body), [children]);

	const dispatchToastMessage = useToastMessageDispatch();

	const handleAgentCalled = (queue: any): void => {
		dispatchToastMessage({
			type: 'success',
			message: `Received call in ${queue.queuename} `,
			options: {
				showDuration: '6000',
				hideDuration: '6000',
				timeOut: '50000',
				preventDuplicates: true,
			},
		});
		console.log(`Received call from ${JSON.stringify(queue)}`);
	};
	const handleQueueJoined = async (joiningDetails: any): Promise<void> => {
		console.log(`Queue Joined ${JSON.stringify(joiningDetails)}`);
		dispatchToastMessage({
			type: 'success',
			message: `Received call in ${joiningDetails.queuename} from customerid ${joiningDetails.callerid.id}`,
			options: {
				showDuration: '6000',
				hideDuration: '6000',
				timeOut: '50000',
				preventDuplicates: true,
			},
		});
		const list = await APIClient.v1.get('voip/queues.getQueuedCallsForThisExtension', {
			extension: '80000',
		});
		dispatchToastMessage({
			type: 'success',
			message: `Calls waiting in ${joiningDetails.queuename} are ${list.callWaitingCount}`,
			options: {
				showDuration: '6000',
				hideDuration: '6000',
				timeOut: '50000',
				preventDuplicates: true,
			},
		});
		console.log(`Call waiting for 80000 ${JSON.stringify(list)}`);
	};
	Notifications.onUser('agentcalled', handleAgentCalled);
	Notifications.onUser('callerjoined', handleQueueJoined);

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
				mute: (): void => undefined, // voipClient.mute(),
				unmute: (): void => undefined, // voipClient.unmute()
				pause: (): Promise<void> => voipClient.holdCall(true), // voipClient.pause()
				resume: (): Promise<void> => voipClient.holdCall(false), // voipClient.resume()
				end: (): Promise<OutgoingByeRequest | void> => voipClient.endCall(),
				pickUp: async (): Promise<void | null> =>
					remoteAudioMediaRef.current && voipClient.acceptCall({ remoteMediaElement: remoteAudioMediaRef.current }),
				reject: (): Promise<void> => voipClient.rejectCall(),
			},
		};
	}, [result]);
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
