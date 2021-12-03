import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useEffect, useMemo, useState } from 'react';

import { IRegistrationInfo } from '../../../components/voip/IRegistrationInfo';
import { SimpleVoipUser } from '../../../components/voip/SimpleVoipUser';
import { VoIPUser } from '../../../components/voip/VoIPUser';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../lib/asyncState';
import { useWebRtcServers } from './useWebRtcServers';

type UseVoipClientResult =
	| UseVoipClientResultResolved
	| UseVoipClientResultError
	| UseVoipClientResultLoading;

type UseVoipClientResultResolved = {
	voipClient: VoIPUser;
	registrationInfo: IRegistrationInfo;
};
type UseVoipClientResultError = { error: Error };
type UseVoipClientResultLoading = Record<string, never>;

export const isUseVoipClientResultError = (
	result: UseVoipClientResult,
): result is UseVoipClientResultError => !!(result as UseVoipClientResultError).error;

export const isUseVoipClientResultLoading = (
	result: UseVoipClientResult,
): result is UseVoipClientResultLoading => Object.keys(result).length === 0;

export const useVoipClient = (): UseVoipClientResult => {
	const config = useEndpointData(
		'connector.extension.getRegistrationInfo',
		useMemo(() => ({ extension: '80000' }), []),
	);

	// TODO: should we recreate the client if the server list changes? this can disrupt the call

	const iceServers = useWebRtcServers();

	const [result, setResult] = useSafely(useState<UseVoipClientResult>({}));

	useEffect(() => {
		if (config.phase === AsyncStatePhase.REJECTED) {
			setResult({ error: config.error as Error });
			return;
		}

		if (config.phase !== AsyncStatePhase.RESOLVED) {
			setResult({});
			return;
		}

		const {
			extensionDetails: { extension, password },
			host,
			callServerConfig: { websocketPath },
		} = config.value;
		let client: VoIPUser;
		(async (): Promise<void> => {
			try {
				client = await SimpleVoipUser.create(
					extension,
					password,
					host,
					websocketPath,
					iceServers,
					'video',
				);
				setResult({ voipClient: client, registrationInfo: config.value });
			} catch (e) {
				setResult({ error: e as Error });
			}
		})();
		return (): void => {
			// client?.disconnect();
			// TODO how to close the client? before creating a new one?
		};
	}, [iceServers, config.phase, config.value, setResult, config.error]);

	return result;
};
