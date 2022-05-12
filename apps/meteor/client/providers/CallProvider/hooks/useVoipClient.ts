import { IRegistrationInfo, WorkflowTypes } from '@rocket.chat/core-typings';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useUser, useSetting, useEndpoint, useStream } from '@rocket.chat/ui-contexts';
import { KJUR } from 'jsrsasign';
import { useEffect, useState } from 'react';

import { SimpleVoipUser } from '../../../lib/voip/SimpleVoipUser';
import { VoIPUser } from '../../../lib/voip/VoIPUser';
import { useWebRtcServers } from './useWebRtcServers';

type UseVoipClientResult = {
	voipClient?: VoIPUser;
	registrationInfo?: IRegistrationInfo;
	error?: Error | unknown;
};

const empty = {};

const isSignedResponse = (data: any): data is { result: string } => typeof data?.result === 'string';

export const useVoipClient = (): UseVoipClientResult => {
	const [voipEnabled, setVoipEnabled] = useSafely(useState(useSetting('VoIP_Enabled')));
	const voipRetryCount = useSetting('VoIP_Retry_Count');
	const enableKeepAlive = useSetting('VoIP_Enable_Keep_Alive_For_Unstable_Networks');
	const registrationInfo = useEndpoint('GET', 'connector.extension.getRegistrationInfoByUserId');
	const membership = useEndpoint('GET', 'voip/queues.getMembershipSubscription');
	const user = useUser();
	const subscribeToNotifyLoggedIn = useStream('notify-logged');
	const iceServers = useWebRtcServers();
	const [result, setResult] = useSafely(useState<UseVoipClientResult>({}));

	useEffect(() => {
		const voipEnableEventHandler = (enabled: boolean): void => {
			setVoipEnabled(enabled);
		};
		return subscribeToNotifyLoggedIn(`voip.statuschanged`, voipEnableEventHandler);
	}, [setResult, setVoipEnabled, subscribeToNotifyLoggedIn]);

	useEffect(() => {
		const uid = user?._id;
		const userExtension = user?.extension;

		if (!uid || !userExtension || !voipEnabled) {
			setResult(empty);
			return;
		}
		let client: VoIPUser;
		registrationInfo({ id: uid }).then(
			(data) => {
				let parsedData: IRegistrationInfo;
				if (isSignedResponse(data)) {
					const result = KJUR.jws.JWS.parse(data.result);
					parsedData = (result.payloadObj as any)?.context as IRegistrationInfo;
				} else {
					parsedData = data;
				}

				const {
					extensionDetails: { extension, password },
					host,
					callServerConfig: { websocketPath },
				} = parsedData;

				(async (): Promise<void> => {
					try {
						const subscription = await membership({ extension });
						client = await SimpleVoipUser.create(
							extension,
							password,
							host,
							websocketPath,
							iceServers,
							Number(voipRetryCount),
							Boolean(enableKeepAlive),
							'video',
						);
						// Today we are hardcoding workflow mode.
						// In future, this should be ready from configuration
						client.setWorkflowMode(WorkflowTypes.CONTACT_CENTER_USER);
						client.setMembershipSubscription(subscription);
						setResult({ voipClient: client, registrationInfo: parsedData });
					} catch (error) {
						setResult({ error });
					}
				})();
			},
			(error: Error) => {
				setResult({ error });
			},
		);
		return (): void => {
			if (client) {
				client.clear();
			}
		};
	}, [iceServers, registrationInfo, setResult, membership, voipEnabled, user?._id, user?.extension, voipRetryCount, enableKeepAlive]);

	return result;
};
