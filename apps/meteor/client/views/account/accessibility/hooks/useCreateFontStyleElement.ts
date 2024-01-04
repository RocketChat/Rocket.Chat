import { useMemo } from 'react';

const createStyleElement = (id: string) => {
	const styleElement = document.getElementById(id);
	if (styleElement) {
		return styleElement;
	}
	const newStyleElement = document.createElement('style');
	newStyleElement.setAttribute('id', id);
	return newStyleElement;
};

export const useCreateFontStyleElement = (): ((fontSize: string) => void) => {
	return useMemo(
		() => (fontSize: string) => {
			const styleElement = createStyleElement('rcx-font-size');
			const css = `html { font-size: ${fontSize}; }`;
			styleElement.innerHTML = css;
			document.head.appendChild(styleElement);
		},
		[],
	);
};
