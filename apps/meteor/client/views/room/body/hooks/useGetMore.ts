import type { MutableRefObject } from 'react';
import { useCallback } from 'react';

import { RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';

export const useGetMore = (rid: string, atBottomRef: MutableRefObject<boolean>) => {
	return useCallback(
		(wrapper: HTMLElement | null) => {
			if (!wrapper) {
				return;
			}

			let lastScrollTopRef = 0;

			wrapper.addEventListener(
				'scroll',
				withThrottling({ wait: 100 })((event) => {
					lastScrollTopRef = event.target.scrollTop;
					const height = event.target.clientHeight;
					const isLoading = RoomHistoryManager.isLoading(rid);
					const hasMore = RoomHistoryManager.hasMore(rid);
					const hasMoreNext = RoomHistoryManager.hasMoreNext(rid);

					if ((isLoading === false && hasMore === true) || hasMoreNext === true) {
						if (hasMore === true && lastScrollTopRef <= height / 3) {
							RoomHistoryManager.getMore(rid);
						} else if (hasMoreNext === true && Math.ceil(lastScrollTopRef) >= event.target.scrollHeight - height) {
							RoomHistoryManager.getMoreNext(rid);
							atBottomRef.current = false;
						}
					}
				}),
			);
		},
		[atBottomRef, rid],
	);
};
