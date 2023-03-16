import type { ServerStreamerNames, StreamerEvents } from '@rocket.chat/ui-contexts/src/ServerContext/methods';
import { useContext, useMemo } from 'react';

import { ServerContext } from '../ServerContext';

// T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;
export type ServerStreamFunction<StreamName extends ServerStreamerNames> = (
	args: StreamerEvents[StreamName],
	callback: (...args: any) => void,
) => () => void;

export function useStream<StreamName extends string>(
	streamName: StreamName extends ServerStreamerNames ? never : StreamName,
	options?: {
		retransmit?: boolean;
		retransmitToSelf?: boolean;
	},
): (key: string, cb: (...args: unknown[]) => void) => () => void;
export function useStream<StreamName extends ServerStreamerNames>(
	streamName: StreamName,
	options?: {
		retransmit?: boolean | undefined;
		retransmitToSelf?: boolean | undefined;
	},
): StreamerEvents[StreamName];
export function useStream<StreamName extends ServerStreamerNames>(
	streamName: StreamName,
	options?: {
		retransmit?: boolean | undefined;
		retransmitToSelf?: boolean | undefined;
	},
): StreamerEvents[StreamName] {
	const { getStream } = useContext(ServerContext);
	return useMemo(() => getStream(streamName, options), [getStream, streamName, options]);
}
