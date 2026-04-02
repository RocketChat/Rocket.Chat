import { useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import { useSearchParameter } from '@rocket.chat/ui-contexts';
import type { MutableRefObject, RefObject } from 'react';
import { useCallback, useEffect, useRef } from 'react';

import { RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import type { VirtualizerHelpers } from '../../MessageList';

export const useGetMore = (rid: string, atBottomRef: MutableRefObject<boolean>, virtualizerHelpersRef: RefObject<VirtualizerHelpers>) => {
	const msgId = useSearchParameter('msg');
	const msgIdRef = useRef(msgId);
	const jumpToRef = useRef<HTMLElement>(undefined);
	// TODO: Improve this logic
	const initializedRef = useRef(false);

	useEffect(() => {
		msgIdRef.current = msgId;
	}, [msgId]);

	const ref = useSafeRefCallback(
		useCallback(
			(element: HTMLElement) => {
				const checkPositionAndGetMore = withThrottling({ wait: 100 })(async () => {
					if (initializedRef.current === false && !RoomHistoryManager.isLoading(rid)) {
						await RoomHistoryManager.getMore(rid);
						initializedRef.current = true;
						return;
					}
					if (!element.isConnected) {
						return;
					}

					if (jumpToRef.current) {
						return;
					}

					if (RoomHistoryManager.isLoading(rid)) {
						return;
					}

					if (msgIdRef.current && !RoomHistoryManager.isLoaded(rid)) {
						return;
					}

					if (!virtualizerHelpersRef.current) {
						return;
					}

					const hasMore = RoomHistoryManager.hasMore(rid);
					const hasMoreNext = RoomHistoryManager.hasMoreNext(rid);

					if (hasMore === true && virtualizerHelpersRef.current.shouldGetMore() === true) {
						await RoomHistoryManager.getMore(rid);
					} else if (hasMoreNext === true && virtualizerHelpersRef.current.shouldGetMoreNext() === true) {
						await RoomHistoryManager.getMoreNext(rid, atBottomRef);
						atBottomRef.current = false;
					}
				});

				const mutationObserver = new MutationObserver((mutations) => {
					mutations.forEach(() => {
						checkPositionAndGetMore();
					});
				});

				mutationObserver.observe(element, { childList: true, subtree: true });

				const observer = new ResizeObserver(() => {
					checkPositionAndGetMore();
				});

				observer.observe(element);

				const handleScroll = function () {
					checkPositionAndGetMore();
				};

				element.addEventListener('scroll', handleScroll, {
					passive: true,
				});

				return () => {
					observer.disconnect();
					mutationObserver.disconnect();
					checkPositionAndGetMore.cancel();
					element.removeEventListener('scroll', handleScroll);
				};
			},
			[rid, virtualizerHelpersRef, atBottomRef],
		),
	);

	return {
		innerRef: ref,
		jumpToRef,
	};
};
