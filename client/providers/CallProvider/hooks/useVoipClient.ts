import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useEffect, useMemo, useState } from 'react';

import { IRegistrationInfo } from '../../../components/voip/IRegistrationInfo';
import { SimpleVoipUser } from '../../../components/voip/SimpleVoipUser';
import { VoIPUser } from '../../../components/voip/VoIPUser';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../lib/asyncState';
import { useWebRtcServers } from './useWebRtcServers';

export const useVoipClient = (): [VoIPUser, IRegistrationInfo] | [] => {
	const config = useEndpointData(
		'connector.extension.getRegistrationInfo',
		useMemo(() => ({ extension: '80000' }), []),
	);

	// TODO: should we recreate the client if the server list changes? this can disrupt the call

	const iceServers = useWebRtcServers();

	const [result, setClient] = useSafely(useState<[VoIPUser, IRegistrationInfo] | []>([]));

	useEffect(() => {
		if (config.phase !== AsyncStatePhase.RESOLVED) {
			setClient([]);
			return;
		}
		const {
			extensionDetails: { extension, password },
			host,
			callServerConfig: { websocketPath },
		} = config.value;
		let client: VoIPUser;
		(async (): Promise<void> => {
			client = await SimpleVoipUser.create(
				extension,
				password,
				host,
				websocketPath,
				iceServers,
				'video',
			);
			setClient([client, config.value]);
		})();
		return (): void => {
			// client?.disconnect();
			// TODO how to close the client? before creating a new one?
		};
	}, [iceServers, config.phase, config.value, setClient]);

	return result;
};
