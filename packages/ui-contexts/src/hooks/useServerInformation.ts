import type { IServerInfo } from '@rocket.chat/core-typings';
import { useContext } from 'react';

import { ServerContext } from '../ServerContext';

export const useServerInformation = (): IServerInfo => {
	const { info } = useContext(ServerContext);
	if (!info) {
		throw new Error('useServerInformation: no info available');
	}
	return info;
};
