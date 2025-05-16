import type { CSSProperties, MutableRefObject, RefCallback } from 'react';
import { useCallback } from 'react';

export const useAutoGrow = (
	ref: MutableRefObject<HTMLTextAreaElement | null>,
	hideTextArea?: boolean,
): {
	textAreaStyle: CSSProperties;
	autoGrowRef: RefCallback<HTMLTextAreaElement>;
} => {
	const autoGrowRef = useCallback(
		(node: HTMLTextAreaElement) => {
			if (!node) {
				return;
			}

			ref.current = node;

			node.addEventListener('input', (e) => {
				const element = e.target as HTMLTextAreaElement;
				element.style.height = '52px';
				element.style.height = `${element.scrollHeight}px`;

				// Keep cursor on the bottom when inserting a new line
				if (element.scrollHeight > element.clientHeight) {
					element.scrollTop = element.scrollHeight;
				}
			});
		},
		[ref],
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
