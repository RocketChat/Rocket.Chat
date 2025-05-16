import { useSafeRefCallback } from '@rocket.chat/ui-client';
import type { CSSProperties, MutableRefObject, RefCallback } from 'react';
import { useCallback } from 'react';

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
					node.style.height = '0';
					node.style.height = `${node.scrollHeight}px`;

					if (node.scrollHeight > node.clientHeight) {
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
