import { useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import { useSearchParameter } from '@rocket.chat/ui-contexts';
import { startTransition, useCallback } from 'react';

import { RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';

export const useGetMore = (rid: string, isJumpingToMessage: boolean) => {
	const msgId = useSearchParameter('msg');

	const ref = useSafeRefCallback(
		useCallback(
			(element: HTMLElement) => {
				let animationFrameId: number | null = null;

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

					const { scrollTop, clientHeight, scrollHeight } = element;

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

						startTransition(() => {
							RoomHistoryManager.restoreScroll(rid);
						});
					} else if (hasMoreNext === true && Math.ceil(lastScrollTopRef) >= scrollHeight - height) {
						await RoomHistoryManager.getMoreNext(rid);
					}
				});

				const scheduleCheckPositionAndGetMore = (): void => {
					if (animationFrameId !== null) {
						return;
					}

					animationFrameId = requestAnimationFrame(() => {
						animationFrameId = null;
						checkPositionAndGetMore();
					});
				};

				const mutationObserver = new MutationObserver((mutations) => {
					mutations.forEach(() => {
						scheduleCheckPositionAndGetMore();
					});
				});

				mutationObserver.observe(element, { childList: true, subtree: true });

				const observer = new ResizeObserver(() => {
					scheduleCheckPositionAndGetMore();
				});

				observer.observe(element);

				const handleScroll = function () {
					scheduleCheckPositionAndGetMore();
				};

				element.addEventListener('scroll', handleScroll, {
					passive: true,
				});

				return () => {
					observer.disconnect();
					mutationObserver.disconnect();
					if (animationFrameId !== null) {
						cancelAnimationFrame(animationFrameId);
					}
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
