import { useMemo } from 'react';

import { useSetting } from '../../../contexts/SettingsContext';

type IceServer = {
	urls: string;
	username?: string;
	password?: string;
};

export const useWebRtcServers = (): IceServer[] => {
	const servers = useSetting('WebRTC_Servers');

	return useMemo(() => {
		if (typeof servers !== 'string' || !servers.trim()) {
			return [];
		}

		const serversListStr = servers.replace(/\s/g, '');
		const serverList = serversListStr.split(',');

		return serverList.map((server) => {
			const [urls, ...credentials] = server.split('@');
			const [username, credential] = credentials.length === 1 ? credentials[0].split(':') : [];

			const serverConfig: IceServer = {
				urls,
				...(username &&
					credential && {
						username: decodeURIComponent(username),
						credential: decodeURIComponent(credential),
					}),
			};
			return serverConfig;
		});
	}, [servers]);
};
