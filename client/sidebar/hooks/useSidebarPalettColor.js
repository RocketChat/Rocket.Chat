import { useLayoutEffect } from 'react';
import colors from '@rocket.chat/fuselage-tokens/colors';

import { isIE11 } from '../../../app/ui-utils/client/lib/isIE11.js';

const isInternetExplorer11 = false && isIE11();

const getStyleTag = () => {
	const style = document.getElementById('sidebar-style');
	if (style) {
		return style;
	}
	const newElement = document.createElement('style');

	newElement.id = 'sidebar-style';

	document.head.appendChild(newElement);
	return newElement;
};

function h2r(hex, a) {
	const [, r, g, b] = hex.match(/#([0-f]{2})([0-f]{2})([0-f]{2})/i);
	return `rgba(${ [r, g, b].map((value) => parseInt(value, 16)).join() }, ${ a })`;
}

const modifier = '.sidebar--custom-colors';

const getStyle = (() => {
	const selector = isInternetExplorer11 ? ':root' : modifier;
	return (colors) => `
		${ selector } {
			--rcx-color-neutral-100: ${ colors.n900 } ;
			--rcx-color-neutral-200: ${ colors.n800 } ;
			--rcx-color-neutral-300: ${ colors.n700 } ;
			--rcx-color-neutral-400: ${ colors.n600 } ;
			--rcx-color-neutral-500: ${ colors.n500 } ;
			--rcx-color-neutral-600: ${ colors.n400 } ;
			--rcx-color-neutral-700: ${ colors.n300 } ;
			--rcx-color-neutral-800: ${ colors.n200 } ;
			--rcx-color-neutral-900: ${ colors.n100 } ;

			--rcx-color-primary-100: ${ colors.b900 } ;
			--rcx-color-primary-200: ${ colors.b800 } ;
			--rcx-color-primary-300: ${ colors.b700 } ;
			--rcx-color-primary-400: ${ colors.b600 } ;
			--rcx-color-primary-500: ${ colors.b500 } ;
			--rcx-color-primary-600: ${ colors.b400 } ;
			--rcx-color-primary-700: ${ colors.b300 } ;
			--rcx-color-primary-800: ${ colors.b200 } ;
			--rcx-color-primary-900: ${ colors.b100 } ;

			--rcx-button-colors-secondary-active-border-color: ${ colors.n900 } ;
			--rcx-button-colors-secondary-active-background-color: ${ colors.n800 } ;
			--rcx-button-colors-secondary-color: ${ colors.n600 } ;
			--rcx-button-colors-secondary-border-color: ${ colors.n800 } ;
			--rcx-button-colors-secondary-background-color: ${ colors.n800 } ;
			--rcx-button-colors-secondary-hover-background-color: ${ colors.n900 } ;
			--rcx-button-colors-secondary-hover-border-color: ${ colors.n900 } ;
			--rcx-divider-color: ${ h2r(colors.n900, 0.4) };
			--rcx-sidebar-item-background-color-hover: ${ colors.n900 } ;
			--rcx-sidebar-item-background-color-selected: ${ h2r(colors.n700, 0.3) };
			--rcx-tag-colors-ghost-background-color: ${ colors.n700 } ;
			--rcx-color-surface: ${ colors.n900 } ;
		}
		.rcx-sidebar {
			background: var(--rcx-color-neutral-200);
		}
	`;
})();

let counter = 0;
const useSidebarPalettColorIE11 = () => {
	useLayoutEffect(() => {
		const fuselageStyle = document.getElementById('fuselage-id');
		const sidebarStyle = fuselageStyle.cloneNode(true);
		sidebarStyle.setAttribute('id', 'sidebar-styless');
		document.head.appendChild(sidebarStyle);

		const fuselageStyleRules = [...sidebarStyle.sheet.cssRules].filter(({ selectorText }) => selectorText).filter(({ selectorText, cssText }) => /\.rcx-(sidebar|button|divider)/.test(selectorText) && /(color|background|shadow)/.test(cssText) && /var\(--/.test(cssText));
		const newStyle = fuselageStyleRules.map((rule) => {
			// sidebarStyle.
			rule.selectorText = rule.selectorText.split(',').map((rule) => rule.replace(/^((html:not\(\.js-focus-visible\)|\.js-focus-visible)|\.)(.*)/, (match, group, g2, g3, offset, text) => {
				if (group === '.') {
					return `${ modifier } ${ text }`;
				}
				return `${ match } ${ modifier } ${ g3 }`;
			})).join();
			return rule.cssText;
		}).join('');
		sidebarStyle.innerText = newStyle;
		counter++;
		if (counter === 1) {
			getStyleTag().innerText = getStyle(colors);
		}

		const cssVars = require('css-vars-ponyfill').default;

		cssVars({
			include: 'style#sidebar-style, style#sidebar-styless',
			onlyLegacy: false,
			preserveStatic: true,
			silent: true,
		});

		return () => {
			counter--;
			if (counter === 0) {
				getStyleTag().innerText = '';
			}
		};
	}, []);
};

export const useSidebarPalettColor = isInternetExplorer11 ? useSidebarPalettColorIE11 : () => {
	useLayoutEffect(() => {
		counter++;
		if (counter === 1) {
			getStyleTag().innerText = getStyle(colors);
		}

		return () => {
			counter--;
			if (counter === 0) {
				getStyleTag().innerText = '';
			}
		};
	}, []);
};
