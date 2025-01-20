import type { MutableRefObject } from 'react';
import { useEffect, useRef } from 'react';

import { RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';

export const useGetMore = (rid: string, atBottomRef: MutableRefObject<boolean>) => {
	const ref = useRef<HTMLElement>(null);

	useEffect(() => {
		if (!ref.current) {
			return;
		}

		const refValue = ref.current;

		const handleScroll = withThrottling({ wait: 100 })((event) => {
			const lastScrollTopRef = event.target.scrollTop;
			const height = event.target.clientHeight;
			const isLoading = RoomHistoryManager.isLoading(rid);
			const hasMore = RoomHistoryManager.hasMore(rid);
			const hasMoreNext = RoomHistoryManager.hasMoreNext(rid);

			if ((isLoading === false && hasMore === true) || hasMoreNext === true) {
				if (hasMore === true && lastScrollTopRef <= height / 3) {
					RoomHistoryManager.getMore(rid);
				} else if (hasMoreNext === true && Math.ceil(lastScrollTopRef) >= event.target.scrollHeight - height) {
					RoomHistoryManager.getMoreNext(rid, atBottomRef);
					atBottomRef.current = false;
				}
			}
		});

		refValue.addEventListener('scroll', handleScroll);

		return () => {
			refValue.removeEventListener('scroll', handleScroll);
		};
	}, [rid, atBottomRef]);

	return {
		innerRef: ref,
	};
};
