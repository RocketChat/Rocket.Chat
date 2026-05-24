import { useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import { useSearchParameter } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { flushSync } from 'react-dom';

import { getBoundingClientRect } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';

export const useGetMore = (rid: string, isJumpingToMessage: boolean) => {
	const msgId = useSearchParameter('msg');

	const ref = useSafeRefCallback(
		useCallback(
			(element: HTMLElement) => {
				const checkPositionAndGetMore = withThrottling({ wait: 100 })(async () => {
					if (!element.isConnected) {
						return;
					}

					if (isJumpingToMessage) {
						return;
					}

					if (RoomHistoryManager.isLoading(rid)) {
						return;
					}

					if (msgId && !RoomHistoryManager.isLoaded(rid)) {
						RoomHistoryManager.getSurroundingMessages({ _id: msgId, rid });
						return;
					}

					const { scrollTop, clientHeight, scrollHeight } = getBoundingClientRect(element);

					const lastScrollTopRef = scrollTop;
					const height = clientHeight;
					const hasMore = RoomHistoryManager.hasMore(rid);
					const hasMoreNext = RoomHistoryManager.hasMoreNext(rid);

					if (hasMore === true && lastScrollTopRef <= height / 3) {
						await RoomHistoryManager.getMore(rid);

						if (isJumpingToMessage) {
							return;
						}

						if (!element.isConnected) {
							return;
						}

						flushSync(() => {
							RoomHistoryManager.restoreScroll(rid);
						});
					} else if (hasMoreNext === true && Math.ceil(lastScrollTopRef) >= scrollHeight - height) {
						await RoomHistoryManager.getMoreNext(rid);
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
			[isJumpingToMessage, msgId, rid],
		),
	);

	return {
		innerRef: ref,
	};
};
