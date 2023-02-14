import { useContext, useMemo } from 'react';

import { ServerContext } from '../ServerContext';

export const useStream = (
	streamName: string,
	options?: {
		retransmit?: boolean | undefined;
		retransmitToSelf?: boolean | undefined;
	},
): (<TEvent extends unknown[]>(eventName: string, callback: (...event: TEvent) => void) => () => void) => {
	const { getStream } = useContext(ServerContext);
	return useMemo(() => getStream(streamName, options), [getStream, streamName, options]);
};
