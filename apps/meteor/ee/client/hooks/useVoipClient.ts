import type { IRegistrationInfo } from '@rocket.chat/core-typings';
import { WorkflowTypes } from '@rocket.chat/core-typings';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useUser, useSetting, useEndpoint, useStream } from '@rocket.chat/ui-contexts';
import { KJUR } from 'jsrsasign';
import { useEffect, useState } from 'react';

import { VoIPUser } from '../../../client/lib/voip/VoIPUser';
import { useWebRtcServers } from '../../../client/providers/CallProvider/hooks/useWebRtcServers';
import { EEVoipClient } from '../lib/voip/EEVoipClient';
import { useHasLicenseModule } from './useHasLicenseModule';

type UseVoipClientResult = {
	voipClient?: VoIPUser;
	registrationInfo?: IRegistrationInfo;
	error?: Error | unknown;
};

const empty = {};

const isSignedResponse = (data: any): data is { result: string } => typeof data?.result === 'string';

// Currently we only support the websocket connection and the SIP proxy connection being from the same host,
// we need to add a new setting for SIP proxy if we want to support different hosts for them.
export const useVoipClient = (): UseVoipClientResult => {
	const settingVoipEnabled = Boolean(useSetting('VoIP_Enabled'));

	const [voipConnectorEnabled, setVoipConnectorEnabled] = useSafely(useState(true));

	const voipRetryCount = useSetting('VoIP_Retry_Count');
	const enableKeepAlive = useSetting('VoIP_Enable_Keep_Alive_For_Unstable_Networks');
	const registrationInfo = useEndpoint('GET', '/v1/connector.extension.getRegistrationInfoByUserId');
	const membership = useEndpoint('GET', '/v1/voip/queues.getMembershipSubscription');
	const user = useUser();
	const subscribeToNotifyLoggedIn = useStream('notify-logged');
	const iceServers = useWebRtcServers();
	const [result, setResult] = useSafely(useState<UseVoipClientResult>({}));

	const isEE = useHasLicenseModule('voip-enterprise');
	const voipEnabled = settingVoipEnabled && voipConnectorEnabled;

	useEffect(
		() =>
			subscribeToNotifyLoggedIn(`voip.statuschanged`, (enabled: boolean): void => {
				setVoipConnectorEnabled(enabled);
			}),
		[setResult, setVoipConnectorEnabled, subscribeToNotifyLoggedIn],
	);

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
					callServerConfig: { websocketPath },
				} = parsedData;

				(async (): Promise<void> => {
					try {
						const wsURL = new URL(websocketPath);
						const subscription = await membership({ extension });

						const config = {
							authUserName: extension,
							authPassword: password,
							sipRegistrarHostnameOrIP: wsURL.host,
							webSocketURI: websocketPath,
							enableVideo: true,
							iceServers,
							connectionRetryCount: Number(voipRetryCount),
							enableKeepAliveUsingOptionsForUnstableNetworks: Boolean(enableKeepAlive),
						};

						client = await (isEE ? EEVoipClient.create(config) : VoIPUser.create(config));

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
	}, [iceServers, registrationInfo, setResult, membership, voipEnabled, user?._id, user?.extension, voipRetryCount, enableKeepAlive, isEE]);

	return result;
};

export const isOutboundClient = (client: VoIPUser | undefined): client is EEVoipClient => client instanceof EEVoipClient;
