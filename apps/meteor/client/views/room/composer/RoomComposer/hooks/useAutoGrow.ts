import { useSafeRefCallback } from '@rocket.chat/ui-client';
import type { CSSProperties, MutableRefObject, RefCallback } from 'react';
import { useCallback } from 'react';

function shouldScrollToBottom(textarea: HTMLTextAreaElement) {
	const isCursorAtBottom = textarea.selectionEnd === textarea.value.length;
	const isScrolledToBottom = textarea.scrollTop + textarea.clientHeight === textarea.scrollHeight;

	return isCursorAtBottom || isScrolledToBottom;
}

export const useAutoGrow = (
	ref: MutableRefObject<HTMLTextAreaElement | null>,
	hideTextArea?: boolean,
): {
	textAreaStyle: CSSProperties;
	autoGrowRef: RefCallback<HTMLTextAreaElement>;
} => {
	const autoGrowRef = useSafeRefCallback(
		useCallback(
			(node: HTMLTextAreaElement) => {
				if (!node) {
					return;
				}

				ref.current = node;

				const resize = () => {
					const shouldScroll = shouldScrollToBottom(node);

					node.style.height = '0';
					node.style.height = `${node.scrollHeight}px`;

					if (shouldScroll) {
						node.scrollTop = node.scrollHeight;
					}
				};

				const resizeObserver = new ResizeObserver(resize);

				resizeObserver.observe(node);

				node.addEventListener('input', resize);

				return () => {
					resizeObserver.disconnect();
					node.removeEventListener('input', resize);
				};
			},
			[ref],
		),
	);

	return {
		autoGrowRef,
		textAreaStyle: {
			...(hideTextArea && {
				visibility: 'hidden',
			}),
			whiteSpace: 'pre-wrap',
			wordWrap: 'break-word',
			overflowWrap: 'break-word',
			willChange: 'contents',
			wordBreak: 'normal',
		},
	};
};
