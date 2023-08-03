import type { FontSize } from '@rocket.chat/rest-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useEffect, useState } from 'react';

const createElement = () => {
	const styleElement = document.getElementById('rcx-font-size');
	if (styleElement) {
		return styleElement;
	}
	const newStyleElement = document.createElement('style');
	newStyleElement.setAttribute('id', 'rcx-font-size');
	return newStyleElement;
};

export const useAdjustableFontSize = (): [FontSize, (value: FontSize) => void] => {
	const fontSizePreference = useUserPreference<FontSize>('fontSize') || '100';
	const [fontSize, setFontSize] = useState<FontSize>(fontSizePreference);

	const css = `* {
		font-size: ${fontSize}%;
		}`;

	useEffect(() => {
		const styleElement = createElement();
		styleElement.innerHTML = css;
		document.head.appendChild(styleElement);
	}, [fontSize, css]);

	return [fontSize, setFontSize];
};
