import { useRouter, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useRef, useEffect } from 'react';

import { waitForElement } from '../../../../../lib/utils/waitForElement';
import { clearHighlightMessage, setHighlightMessage } from '../../../MessageList/providers/messageHighlightSubscription';

export const useLegacyThreadMessageJump = ({ enabled = true }: { enabled?: boolean }) => {
	const router = useRouter();
	const mid = useSearchParameter('msg');

	const clearQueryStringParameter = () => {
		const name = router.getRouteName();

		if (!name) {
			return;
		}

		const { msg: _, ...search } = router.getSearchParameters();

		router.navigate(
			{
				name,
				params: router.getRouteParameters(),
				search,
			},
			{ replace: true },
		);
	};

	const parentRef = useRef<HTMLElement>(null);
	const clearQueryStringParameterRef = useRef(clearQueryStringParameter);
	clearQueryStringParameterRef.current = clearQueryStringParameter;

	useEffect(() => {
		const parent = parentRef.current;

		if (!enabled || !mid || !parent) {
			return;
		}

		const abortController = new AbortController();

		waitForElement<HTMLElement>(`[data-id='${mid}']`, { parent, signal: abortController.signal }).then((messageElement) => {
			if (abortController.signal.aborted) {
				return;
			}

			setHighlightMessage(mid);
			clearQueryStringParameterRef.current?.();

			setTimeout(() => {
				clearHighlightMessage();
			}, 1000);

			setTimeout(() => {
				if (abortController.signal.aborted) {
					return;
				}

				messageElement.scrollIntoView({
					behavior: 'smooth',
					block: 'nearest',
				});
			}, 300);
		});

		return () => {
			abortController.abort();
		};
	}, [enabled, mid]);

	return { parentRef };
};
