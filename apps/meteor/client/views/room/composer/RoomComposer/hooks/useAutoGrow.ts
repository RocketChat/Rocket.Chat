import { useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import type { CSSProperties, RefCallback } from 'react';
import { useCallback } from 'react';

function shouldScrollToBottom(textarea: HTMLTextAreaElement) {
	const isCursorAtBottom = textarea.selectionEnd === textarea.value.length;
	const isScrolledToBottom = textarea.scrollTop + textarea.clientHeight === textarea.scrollHeight;

	return isCursorAtBottom || isScrolledToBottom;
}

export const useAutoGrow = (
	hideTextArea?: boolean,
): {
	textAreaStyle: CSSProperties;
	autoGrowRef: RefCallback<HTMLTextAreaElement>;
} => {
	const autoGrowRef = useSafeRefCallback(
		useCallback((node: HTMLTextAreaElement) => {
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
		}, []),
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
