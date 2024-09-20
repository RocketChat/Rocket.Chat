import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import type { IceServer } from '../definitions';
import { parseStringToIceServers } from '../utils/parseStringToIceServers';

export const useWebRtcServers = (): IceServer[] => {
	const servers = useSetting('WebRTC_Servers');

	return useMemo(() => {
		if (typeof servers !== 'string' || !servers.trim()) {
			return [];
		}
		return parseStringToIceServers(servers);
	}, [servers]);
};
