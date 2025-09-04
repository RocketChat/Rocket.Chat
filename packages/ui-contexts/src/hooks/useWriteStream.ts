import type { StreamNames, StreamKeys, StreamerCallbackArgs } from '@rocket.chat/ddp-client';
import { useCallback, useContext } from 'react';

import { ServerContext } from '../ServerContext';

type WriteStreamCallback<N extends StreamNames> = <K extends StreamKeys<N>>(eventName: K, ...args: StreamerCallbackArgs<N, K>) => void;

export function useWriteStream<N extends StreamNames>(streamName: N): WriteStreamCallback<N> {
	const { writeStream } = useContext(ServerContext);

	if (!writeStream) {
		throw new Error(`cannot use useWriteStream(${streamName}) hook without a wrapping ServerContext`);
	}

	return useCallback(
		<K extends StreamKeys<N>>(eventName: K, ...args: StreamerCallbackArgs<N, K>) => writeStream(streamName, eventName, ...args),
		[writeStream, streamName],
	);
}
