import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import type { IceServer } from '../definitions/IceServer';
import { parseStringToIceServers } from '../lib/parseStringToIceServers';

export const useWebRtcServers = (): IceServer[] => {
	const servers = useSetting('WebRTC_Servers');

	return useMemo(() => {
		if (typeof servers !== 'string' || !servers.trim()) {
			return [];
		}
		return parseStringToIceServers(servers);
	}, [servers]);
};
