import { useCurrentRoute, useQueryStringParameter, useRoute } from '@rocket.chat/ui-contexts';
import { useRef, useEffect } from 'react';

import { waitForElement } from '../../../../../lib/utils/waitForElement';
import { clearHighlightMessage, setHighlightMessage } from '../../../MessageList/providers/messageHighlightSubscription';

export const useLegacyThreadMessageJump = ({ enabled = true }: { enabled?: boolean }) => {
	const mid = useQueryStringParameter('msg');

	const [currentRouteName, currentRouteParams, currentRouteQueryStringParams] = useCurrentRoute();
	if (!currentRouteName) {
		throw new Error('No route name');
	}
	const currentRoute = useRoute(currentRouteName);

	const clearQueryStringParameter = () => {
		const newQueryStringParams = { ...currentRouteQueryStringParams };
		delete newQueryStringParams.msg;
		currentRoute.replace(currentRouteParams, newQueryStringParams);
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
