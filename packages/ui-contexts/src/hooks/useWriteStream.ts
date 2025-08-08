import type { StreamNames } from '@rocket.chat/ddp-client';
import { useCallback, useContext } from 'react';

import { ServerContext } from '../ServerContext';

export function useWriteStream<N extends StreamNames>(streamName: N): (...args: unknown[]) => void {
	const { writeStream } = useContext(ServerContext);

	return useCallback(
		(...args: unknown[]) => {
			if (!writeStream) {
				throw new Error(`cannot use useMethod(${streamName}) hook without a wrapping ServerContext`);
			}

			return writeStream(streamName, ...args);
		},
		[writeStream, streamName],
	);
}
