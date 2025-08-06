import { useSafeRefCallback } from '@rocket.chat/ui-client';
import { useSearchParameter } from '@rocket.chat/ui-contexts';

import type { MutableRefObject } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';

import { getBoundingClientRect } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';

export const useGetMore = (rid: string, atBottomRef: MutableRefObject<boolean>) => {
	const msgId = useSearchParameter('msg');
	const msgIdRef = useRef(msgId);
	const jumpToRef = useRef<HTMLElement>(undefined);

	useEffect(() => {
		msgIdRef.current = msgId;
	}, [msgId]);

	const ref = useSafeRefCallback(
		useCallback(
			(element: HTMLElement | null) => {
				if (!element) {
					return;
				}
				const checkPositionAndGetMore = withThrottling({ wait: 100 })(async () => {
					if (!element.isConnected) {
						return;
					}

					const { scrollTop, clientHeight, scrollHeight } = getBoundingClientRect(element);

					if (msgIdRef.current && !RoomHistoryManager.isLoaded(rid)) {
						return;
					}

					const lastScrollTopRef = scrollTop;
					const height = clientHeight;
					const isLoading = RoomHistoryManager.isLoading(rid);
					const hasMore = RoomHistoryManager.hasMore(rid);
					const hasMoreNext = RoomHistoryManager.hasMoreNext(rid);

					if (jumpToRef.current) {
						return;
					}

					if (isLoading) {
						return;
					}

					if (hasMore === true && lastScrollTopRef <= height / 3) {
						await RoomHistoryManager.getMore(rid);

						if (jumpToRef.current) {
							return;
						}
						flushSync(() => {
							RoomHistoryManager.restoreScroll(rid);
						});
					} else if (hasMoreNext === true && Math.ceil(lastScrollTopRef) >= scrollHeight - height) {
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
			[rid, atBottomRef],
		),
	);

	return {
		innerRef: ref,
		jumpToRef,
	};
};
