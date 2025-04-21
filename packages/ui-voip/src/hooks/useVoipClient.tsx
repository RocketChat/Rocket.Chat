import { useUser, useEndpoint, useSetting } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useIceServers } from './useIceServers';
import VoipClient from '../lib/VoipClient';

type VoipClientParams = {
	enabled?: boolean;
	autoRegister?: boolean;
};

type VoipClientResult = {
	voipClient: VoipClient | null;
	error: Error | null;
};

export const useVoipClient = ({ enabled = true, autoRegister = true }: VoipClientParams = {}): VoipClientResult => {
	const { _id: userId } = useUser() || {};
	const voipClientRef = useRef<VoipClient | null>(null);

	const getRegistrationInfo = useEndpoint('GET', '/v1/voip-freeswitch.extension.getRegistrationInfoByUserId');
	const iceGatheringTimeout = useSetting('VoIP_TeamCollab_Ice_Gathering_Timeout', 5000);

	const iceServers = useIceServers();

	const { data: voipClient, error } = useQuery<VoipClient | null, Error>({
		queryKey: ['voip-client', enabled, userId, iceServers],
		queryFn: async () => {
			if (voipClientRef.current) {
				voipClientRef.current.clear();
			}

			if (!userId) {
				throw Error('error-user-not-found');
			}

			const registrationInfo = await getRegistrationInfo({ userId })
				.then((registration) => {
					if (!registration) {
						throw Error('error-registration-not-found');
					}

					return registration;
				})
				.catch((e) => {
					throw Error(e.error || 'error-registration-not-found');
				});

			const {
				extension: { extension },
				credentials: { websocketPath, password },
			} = registrationInfo;

			const config = {
				iceServers,
				authUserName: extension,
				authPassword: password,
				sipRegistrarHostnameOrIP: new URL(websocketPath).host,
				webSocketURI: websocketPath,
				connectionRetryCount: Number(10), // TODO: get from settings
				enableKeepAliveUsingOptionsForUnstableNetworks: true, // TODO: get from settings
				iceGatheringTimeout,
			};

			const voipClient = await VoipClient.create(config);

			if (autoRegister) {
				voipClient.register();
			}

			return voipClient;
		},
		initialData: null,
		enabled,
	});

	useEffect(() => {
		voipClientRef.current = voipClient;

		return () => voipClientRef.current?.clear();
	}, [voipClient]);

	return { voipClient, error };
};
