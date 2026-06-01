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
				// Observers (MutationObserver, ResizeObserver) fire during the initial mount cascade
				// as messages are inserted and the virtualizer measures itself. At that point scrollTop
				// is still 0 because scroll-to-bottom hasn't run yet, which made checkPositionAndGetMore
				// pull a second history page immediately after the first. Gate observer-driven calls on
				// real user input (wheel / touch / scroll-affecting keys); programmatic scroll does not
				// flip this flag.
				let userInteracted = false;

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

				const gatedCheck = () => {
					// Surrounding-messages fetch (when navigating to ?msg=...) needs to fire once on
					// the initial observer pass before the user has interacted.
					const allowedByJumpToMessage = !!msgId && !RoomHistoryManager.isLoaded(rid);
					if (!userInteracted && !allowedByJumpToMessage) {
						return;
					}
					checkPositionAndGetMore();
				};

				const mutationObserver = new MutationObserver(gatedCheck);
				mutationObserver.observe(element, { childList: true, subtree: true });

				const observer = new ResizeObserver(gatedCheck);
				observer.observe(element);

				const markInteracted = () => {
					userInteracted = true;
				};

				const handleKeydown = (e: KeyboardEvent) => {
					if (
						e.key === 'PageUp' ||
						e.key === 'PageDown' ||
						e.key === 'ArrowUp' ||
						e.key === 'ArrowDown' ||
						e.key === 'Home' ||
						e.key === 'End'
					) {
						userInteracted = true;
					}
				};

				const handleScroll = () => {
					if (!userInteracted) {
						return;
					}
					checkPositionAndGetMore();
				};

				element.addEventListener('wheel', markInteracted, { passive: true });
				element.addEventListener('touchmove', markInteracted, { passive: true });
				element.addEventListener('keydown', handleKeydown);
				element.addEventListener('scroll', handleScroll, { passive: true });

				return () => {
					observer.disconnect();
					mutationObserver.disconnect();
					checkPositionAndGetMore.cancel();
					element.removeEventListener('wheel', markInteracted);
					element.removeEventListener('touchmove', markInteracted);
					element.removeEventListener('keydown', handleKeydown);
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
