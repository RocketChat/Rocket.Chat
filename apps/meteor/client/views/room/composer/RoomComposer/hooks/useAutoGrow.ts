import { useContentBoxSize } from '@rocket.chat/fuselage-hooks';
import type { CSSProperties, RefObject } from 'react';
import { useEffect, useState } from 'react';

const shadowStyleBase: CSSProperties = {
	position: 'fixed',
	top: '-10000px',
	left: '-10000px',
	resize: 'none',
	whiteSpace: 'pre-wrap',
	wordWrap: 'break-word',
	willChange: 'contents',
};

export const useAutoGrow = (
	ref: RefObject<HTMLTextAreaElement>,
	shadowRef: RefObject<HTMLDivElement>,
	hideTextArea?: boolean,
): {
	textAreaStyle: CSSProperties;
	shadowStyle: CSSProperties;
} => {
	const [style, setStyle] = useState(() => ref.current && window.getComputedStyle(ref.current));

	useEffect(() => {
		const { current: textarea } = ref;

		if (!textarea) {
			return;
		}
		setStyle(() => ref.current && window.getComputedStyle(ref.current));
	}, [ref]);

	useEffect(() => {
		const { current: textarea } = ref;

		if (!textarea) {
			return;
		}
		const updateTextareaSize = () => {
			const { value } = textarea;
			const { current: shadow } = shadowRef;
			if (!shadow) {
				return;
			}
			shadow.innerHTML = value
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/\n$/, '<br/>&nbsp;')
				.replace(/\n/g, '<br/>');
		};
		updateTextareaSize();
		textarea.addEventListener('input', updateTextareaSize);
		return () => {
			textarea.removeEventListener('input', updateTextareaSize);
		};
	}, [ref, shadowRef]);

	const shadowContentSize = useContentBoxSize(shadowRef);

	const composerContentSize = useContentBoxSize(ref);

	return {
		textAreaStyle: {
			...(hideTextArea && {
				visibility: 'hidden',
			}),
			whiteSpace: 'pre-wrap',
			wordWrap: 'break-word',
			overflowWrap: 'break-word',
			willChange: 'contents',
			wordBreak: 'normal',
			overflowY: shadowContentSize.blockSize > parseInt(style?.maxHeight || '0') ? 'scroll' : 'hidden',
			...(shadowContentSize.blockSize && {
				height: `${shadowContentSize.blockSize}px`,
			}),
		},
		shadowStyle: {
			...shadowStyleBase,
			font: style?.font,
			width: composerContentSize.inlineSize,
			minHeight: style?.lineHeight,
			lineHeight: style?.lineHeight,
		},
	};
};
