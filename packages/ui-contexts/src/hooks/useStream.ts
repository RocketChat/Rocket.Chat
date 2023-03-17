import type { ServerStreamerNames, StreamerEvents } from '@rocket.chat/ui-contexts/src/ServerContext/streams';
import { useContext, useMemo } from 'react';

import { ServerContext } from '../ServerContext';

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

/*
 * @param streamName The name of the stream to subscribe to
 * @returns A function that can be used to subscribe to the stream
 * the main difference between this and useStream is that this function
 * will only subscribe to the `stream + key` only once, but you can still add multiple callbacks
 * to the same path
 */

export function useSingleStream<StreamName extends ServerStreamerNames>(
	streamName: StreamName,
	options?: {
		retransmit?: boolean | undefined;
		retransmitToSelf?: boolean | undefined;
	},
): StreamerEvents[StreamName] {
	const { getSingleStream } = useContext(ServerContext);
	return useMemo(() => getSingleStream(streamName, options), [getSingleStream, streamName, options]);
}
