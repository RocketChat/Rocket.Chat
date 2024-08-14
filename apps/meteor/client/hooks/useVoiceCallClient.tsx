import { useUser, useSetting, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import VoIPClient from '../lib/voip/VoIPClient';
import { useWebRtcServers } from '../providers/OmnichannelCallProvider/hooks/useWebRtcServers';

type VoiceCallClientParams = {
	autoRegister?: boolean;
};

type VoiceCallClientResult = {
	voipClient: VoIPClient | null;
	error: Error | null;
};

export const useVoiceCallClient = ({ autoRegister = true }: VoiceCallClientParams): VoiceCallClientResult => {
	const { _id: userId } = useUser() || {};
	const isVoipEnabled = useSetting<boolean>('VoIP_TeamCollab_Enabled');
	const voipClientRef = useRef<VoIPClient | null>(null);

	const getRegistrationInfo = useEndpoint('GET', '/v1/voip-freeswitch.extension.getRegistrationInfoByUserId');

	const iceServers = useWebRtcServers();

	const { data: voipClient, error } = useQuery<VoIPClient | null, Error>(
		['voice-call-client', isVoipEnabled, userId, iceServers],
		async () => {
			if (voipClientRef.current) {
				voipClientRef.current.clear();
			}

			if (!userId) {
				throw Error('User_not_found');
			}

			const registrationInfo = await getRegistrationInfo({ userId })
				.then((registration) => {
					if (!registration) {
						throw Error();
					}

					return registration;
				})
				.catch(() => {
					throw Error('Registration_information_not_found');
				});

			const {
				extension: { extension },
				credentials: { websocketPath, password },
			} = registrationInfo;

			if (!extension) {
				throw Error('User_extension_not_found');
			}

			const config = {
				iceServers,
				authUserName: extension,
				authPassword: password,
				sipRegistrarHostnameOrIP: new URL(websocketPath).host,
				webSocketURI: websocketPath,
				connectionRetryCount: Number(10), // TODO: get from settings
				enableKeepAliveUsingOptionsForUnstableNetworks: true, // TODO: get from settings
			};

			const voipClient = await VoIPClient.create(config);

			if (autoRegister) {
				voipClient.register();
			}

			return voipClient;
		},
		{
			initialData: null,
			enabled: !!userId,
		},
	);

	useEffect(() => {
		voipClientRef.current = voipClient;

		return () => voipClientRef.current?.clear();
	}, [voipClient]);

	return { voipClient, error };
};

export default useVoiceCallClient;
