import { useCallback } from 'react';

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
	return useCallback((fontSize: string) => {
		const styleElement = createStyleElement('rcx-font-size');
		const css = `html { font-size: ${fontSize}; }`;
		styleElement.innerHTML = css;
		document.head.appendChild(styleElement);
	}, []);
};
