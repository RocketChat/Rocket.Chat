import type { StreamNames, StreamerEvents, StreamKeys, StreamerCallbackArgs } from '@rocket.chat/ddp-client';
import { useContext, useMemo } from 'react';

import { ServerContext } from '../ServerContext';

// Define a type for a function that can be used to unsubscribe from a stream
export type ServerStreamFunction<N extends StreamNames, K extends StreamKeys<N>> = (
	args: K,
	callback: (...args: StreamerCallbackArgs<N, K>) => void,
) => () => void;

// Define a type for the configuration of a stream, based on its name
type StreamsConfigs<N extends StreamNames> = StreamerEvents[N][number];

// Define a type for the callback function that will be returned by useStream/useSingleStream
// This type will depend on the type of the stream it subscribes to
type StreamerCallback<S extends StreamNames, N extends StreamsConfigs<S> = StreamsConfigs<S>> = <E extends N['key']>(
	eventName: E,
	cb: (...event: StreamerCallbackArgs<S, E>) => void,
) => () => void;
export function useStream<N extends StreamNames>(
	streamName: N,
	options?: {
		retransmit?: boolean;
		retransmitToSelf?: boolean;
	},
): StreamerCallback<N> {
	const { getStream } = useContext(ServerContext);
	return useMemo(() => getStream(streamName, options), [getStream, streamName, options]);
}
