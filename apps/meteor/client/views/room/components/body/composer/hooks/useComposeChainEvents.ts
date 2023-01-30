/**
 * Hook to merge events from multiple hooks
 * if returns false, continue with other hooks
 * if returns true, stop the chain
 *
 */

import { useCallback } from 'react';

export const useComposeChainEvents = <E>(events: Array<(e: E) => boolean>): ((e: E) => boolean) => {
	const handler = useCallback(
		(event: E) => {
			for (const e of events) {
				if (e(event)) {
					return true;
				}
			}
			return false;
		},
		[events],
	);

	return handler;
};
