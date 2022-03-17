import { useSafely } from '@rocket.chat/fuselage-hooks';
import { KJUR } from 'jsrsasign';
import { useEffect, useState } from 'react';

import { IRegistrationInfo } from '../../../../definition/voip/IRegistrationInfo';
import { WorkflowTypes } from '../../../../definition/voip/WorkflowTypes';
import { useEndpoint } from '../../../contexts/ServerContext';
import { useSetting } from '../../../contexts/SettingsContext';
import { useUser, useUserId } from '../../../contexts/UserContext';
import { SimpleVoipUser } from '../../../lib/voip/SimpleVoipUser';
import { VoIPUser } from '../../../lib/voip/VoIPUser';
import { useWebRtcServers } from './useWebRtcServers';

type UseVoipClientResult = UseVoipClientResultResolved | UseVoipClientResultError | UseVoipClientResultLoading;

type UseVoipClientResultResolved = {
	voipClient: VoIPUser;
	registrationInfo: IRegistrationInfo;
};
type UseVoipClientResultError = { error: Error };
type UseVoipClientResultLoading = Record<string, never>;

export const isUseVoipClientResultError = (result: UseVoipClientResult): result is UseVoipClientResultError =>
	!!(result as UseVoipClientResultError).error;

export const isUseVoipClientResultLoading = (result: UseVoipClientResult): result is UseVoipClientResultLoading =>
	!result || !Object.keys(result).length;

const isSignedResponse = (data: any): data is { result: string } => typeof data?.result === 'string';

export const useVoipClient = (): UseVoipClientResult => {
	const voipEnabled = useSetting('VoIP_Enabled');
	const registrationInfo = useEndpoint('GET', 'connector.extension.getRegistrationInfoByUserId');
	const membership = useEndpoint('GET', 'voip/queues.getMembershipSubscription');
	const user = useUser();
	const userId = useUserId();
	const [extension, setExtension] = useSafely(useState<string | null>(null));

	const iceServers = useWebRtcServers();
	const [result, setResult] = useSafely(useState<UseVoipClientResult>({}));
	useEffect(() => {
		if (!userId || !extension || !voipEnabled) {
			setResult({});
			return;
		}
		let client: VoIPUser;
		registrationInfo({ id: userId }).then(
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

				// let client: VoIPUser;
				(async (): Promise<void> => {
					try {
						const subscription = await membership({ extension });
						client = await SimpleVoipUser.create(extension, password, host, websocketPath, iceServers, 'video');
						// Today we are hardcoding workflow mode.
						// In futue, this should be read from configuration
						client.setWorkflowMode(WorkflowTypes.CONTACT_CENTER_USER);
						client.setMembershipSubscription(subscription);
						setResult({ voipClient: client, registrationInfo: parsedData });
					} catch (e) {
						setResult({ error: e as Error });
					}
				})();
			},
			(error) => {
				setResult({ error: error as Error });
			},
		);
		return (): void => {
			// client?.disconnect();
			// TODO how to close the client? before creating a new one?
			if (client) {
				client.clear();
			}
		};
	}, [userId, iceServers, registrationInfo, setResult, membership, voipEnabled, extension]);

	useEffect(() => {
		if (!user) {
			setResult({});
			return;
		}
		if (user.extension) {
			setExtension(user.extension);
		} else {
			setExtension(null);
			if (!isUseVoipClientResultError(result) && !isUseVoipClientResultLoading(result)) {
				const { voipClient } = result as UseVoipClientResultResolved;
				voipClient.clear();
			}
		}
	}, [result, setExtension, setResult, user]);
	return result;
};
