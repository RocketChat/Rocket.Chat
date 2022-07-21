import colors from '@rocket.chat/fuselage-tokens/colors.json';
import { useSettings } from '@rocket.chat/ui-contexts';
import { CSSStyleRule } from 'cssom';
import { useLayoutEffect, useEffect, useMemo } from 'react';

import { isIE11 } from '../../lib/utils/isIE11';

const oldPallet = {
	'color-dark-100': '#0c0d0f',
	'color-dark-90': '#1e232a',
	'color-dark-80': '#2e343e',
	'color-dark-70': '#53585f',
	'color-dark-30': '#9da2a9',
	'color-dark-20': '#caced1',
	'color-dark-10': '#e0e5e8',
	'color-dark-05': '#f1f2f4',
	'color-dark-blue': '#175cc4',
	'color-blue': '#1d74f5',
	'color-light-blue': '#4eb2f5',
	'color-lighter-blue': '#e8f2ff',
	'color-purple': '#861da8',
	'color-red': '#f5455c',
	'color-dark-red': '#e0364d',
	'color-orange': '#f38c39',
	'color-yellow': '#ffd21f',
	'color-dark-yellow': '#f6c502',
	'color-green': '#2de0a5',
	'color-dark-green': '#26d198',
	'color-darkest': '#1f2329',
	'color-dark': '#2f343d',
	'color-dark-medium': '#414852',
	'color-dark-light': '#6c727a',
	'color-gray': '#9ea2a8',
	'color-gray-medium': '#cbced1',
	'color-gray-light': '#e1e5e8',
	'color-gray-lightest': '#f2f3f5',
	'color-black': '#000000',
	'color-white': '#ffffff',
};

const getStyleTag = (): HTMLStyleElement | HTMLElement => {
	const style = document.getElementById('sidebar-style');
	if (style) {
		return style;
	}
	const newElement = document.createElement('style');

	newElement.id = 'sidebar-style';
	newElement.setAttribute('type', 'text/css');

	document.head.appendChild(newElement);
	return newElement;
};

function h2r(hex: string, a: any): string {
	const [hash, r, g, b] = hex.match(/#([0-f]{2})([0-f]{2})([0-f]{2})/i) || [];

	return hash ? `rgba(${[r, g, b].map((value) => parseInt(value, 16)).join()}, ${a})` : hex;
}

const modifier = '.sidebar--custom-colors';

const query = { _id: /theme-color-rc/ };
const useTheme = (): { [key: string]: string } => {
	const customColors = useSettings(query) as { value: string; _id: string }[];
	const result = useMemo(() => {
		const n900 = customColors.find(({ _id }) => _id === 'theme-color-rc-color-primary-darkest');
		const n800 = customColors.find(({ _id }) => _id === 'theme-color-rc-color-primary-dark');
		const sibebarSurface = customColors.find(({ _id }) => _id === 'theme-color-rc-color-primary-background');
		const n700 = customColors.find(({ _id }) => _id === '');
		const n600 = customColors.find(({ _id }) => _id === 'theme-color-rc-color-primary-light');
		const n500 = customColors.find(({ _id }) => _id === 'theme-color-rc-primary-light-medium');

		const n400 = customColors.find(({ _id }) => _id === '');
		const n300 = customColors.find(({ _id }) => _id === '');

		const n200 = customColors.find(({ _id }) => _id === 'theme-color-rc-color-primary-lightest');
		const n100 = customColors.find(({ _id }) => _id === '');
		return {
			...colors,
			...(n900 && { n900: n900.value }),
			...(n800 && { n800: n800.value }),
			...((sibebarSurface || n800) && { sibebarSurface: sibebarSurface?.value || n800?.value }),
			...(n700 && { n700: n700.value }),
			...(n600 && { n600: n600.value }),
			...(n500 && { n500: n500.value }),

			...(n400 && { n400: n400.value }),
			...(n300 && { n300: n300.value }),

			...(n200 && { n200: n200.value }),
			...(n100 && { n100: n100.value }),
		};
	}, [customColors]);
	return result;
};

const toVar = (color: string): string =>
	color && color[0] === '#' ? color : oldPallet[color as keyof typeof oldPallet] || `var(--${color})`;

const getStyle = (
	(selector) =>
	(colors: { [key: string]: string }): string =>
		`
		${selector} {
			--rcx-color-neutral-100: ${toVar(colors.n900)};
			--rcx-color-neutral-200: ${toVar(colors.n800)};
			--rcx-color-neutral-300: ${toVar(colors.n700)};
			--rcx-color-neutral-400: ${toVar(colors.n600)};
			--rcx-color-neutral-500: ${toVar(colors.n500)};
			--rcx-color-neutral-600: ${toVar(colors.n400)};
			--rcx-color-neutral-700: ${toVar(colors.n300)};
			--rcx-color-neutral-800: ${toVar(colors.n200)};
			--rcx-color-neutral-900: ${toVar(colors.n100)};

			--rcx-color-primary-100: ${toVar(colors.b900)};
			--rcx-color-primary-200: ${toVar(colors.b800)};
			--rcx-color-primary-300: ${toVar(colors.b700)};
			--rcx-color-primary-400: ${toVar(colors.b600)};
			--rcx-color-primary-500: ${toVar(colors.b500)};
			--rcx-color-primary-600: ${toVar(colors.b400)};
			--rcx-color-primary-700: ${toVar(colors.b300)};
			--rcx-color-primary-800: ${toVar(colors.b200)};
			--rcx-color-primary-900: ${toVar(colors.b100)};

			--rcx-button-icon-active-border-color: ${toVar(colors.n900)};
			--rcx-button-icon-active-background-color: ${toVar(colors.n800)};
			--rcx-button-icon-color: ${toVar(colors.n600)};
			--rcx-button-icon-border-color: ${toVar(colors.sibebarSurface)};
			--rcx-button-icon-background-color: ${toVar(colors.sibebarSurface)};
			--rcx-button-icon-hover-background-color: ${toVar(colors.n900)};
			--rcx-button-icon-hover-border-color: ${toVar(colors.n900)};
			--rcx-button-icon-focus-background-color:  var(--rcx-color-neutral-300);
			--rcx-button-icon-focus-border-color: var(--rcx-color-neutral-500);
			--rcx-button-icon-focus-shadow-color: none;

			--rcx-button-icon-success-active-border-color: ${toVar(colors.n900)};
			--rcx-button-icon-success-active-background-color: ${toVar(colors.n800)};
			--rcx-button-icon-success-color: ${toVar(colors.n600)};
			--rcx-button-icon-success-border-color: ${toVar(colors.sibebarSurface)};
			--rcx-button-icon-success-background-color: ${toVar(colors.sibebarSurface)};
			--rcx-button-icon-success-hover-background-color: ${toVar(colors.n900)};
			--rcx-button-icon-success-hover-border-color: ${toVar(colors.n900)};


			--rcx-sidebar-item-background-color-hover: ${toVar(colors.n900)};
			--rcx-sidebar-item-background-color-selected: ${h2r(toVar(colors.n700 || colors.n800), 0.3)};
			--rcx-badge-colors-ghost-background-color: ${toVar(colors.n700)};
			--rcx-tag-colors-ghost-background-color: ${toVar(colors.n700)};
			--rcx-color-surface-light: ${toVar(colors.n900)};

			--rcx-button-icon-disabled-color: ${toVar(colors.n700)};
			--rcx-button-icon-disabled-background-color: ${toVar(colors.n900)};
			--rcx-button-icon-disabled-border-color: ${toVar(colors.n900)};

			--rcx-divider-color: ${h2r(toVar(colors.n900), 0.4)};
			--rcx-color-foreground-alternative: ${toVar(colors.n100)};
			--rcx-color-foreground-hint: ${toVar(colors.n600)};
		}

		.rcx-badge--danger {
			--rcx-badge-colors-danger-background-color: ${toVar(colors.r500)}
		}
		.rcx-badge--primary {
			--rcx-badge-colors-primary-background-color: ${toVar(colors.b500)}
		}

		.rcx-sidebar {
			background-color: ${toVar(colors.sibebarSurface)};
		}
		`
)(isIE11 ? ':root' : modifier);

const useSidebarPaletteColorIE11 = (): void => {
	const colors = useTheme();
	useEffect(() => {
		(async (): Promise<void> => {
			const [{ default: cssVars }, CSSOM] = await Promise.all([import('css-vars-ponyfill'), import('cssom')]);
			try {
				getStyleTag().innerHTML = getStyle(colors);
				const fuselageStyle = document.getElementById('fuselage-style');

				if (!fuselageStyle) {
					return;
				}

				const sidebarStyle = fuselageStyle.cloneNode(true) as HTMLElement;
				sidebarStyle.setAttribute('id', 'sidebar-modifier');
				document.head.appendChild(sidebarStyle);

				const fuselageStyleRules: string[] =
					sidebarStyle.innerText
						.match(/(.|\n)*?\{((.|\n)*?)\}(.|\n)*?/gi)
						?.filter((text: string) => /\.rcx-(sidebar|button|divider|input)/.test(text)) || [];

				const sheet = CSSOM.parse(
					fuselageStyleRules
						.join(' ')
						.match(/((?!\}).|\n)*?\{|(.)*(color|background|shadow)(.)*|\}/gi)
						?.join(' ') || '',
				);

				const filterSelectors = (selector: string): boolean => /rcx-(sidebar|button|divider|input)/.test(selector);
				const insertSelector = (selector: string): string =>
					selector.replace(/^((html:not\(\.js-focus-visible\)|\.js-focus-visible)|\.)(.*)/, (match, group, _g2, g3, _offset, text) => {
						if (group === '.') {
							return `${modifier} ${text}`;
						}
						return `${match} ${modifier} ${g3}`;
					});

				sidebarStyle.innerHTML = sheet.cssRules
					.map((rule) => {
						if (!(rule instanceof CSSStyleRule)) {
							return '';
						}
						rule.selectorText = rule.selectorText
							.split(/,[ \n]/)
							.filter(filterSelectors)
							.map(insertSelector)
							.join();
						Array.from({ length: rule.style.length })
							.map((_, index) => rule.style[index])
							.forEach((key, index) => !/color|background|shadow/.test(key) && rule.style.removeProperty(rule.style[index]));
						return rule.cssText;
					})
					.join('');
				cssVars({
					include: 'style#sidebar-style,style#sidebar-modifier',
					onlyLegacy: false,
					preserveStatic: true,
					// preserveVars: true,
					silent: true,
				});
			} catch (error) {
				console.log(error);
			}
		})();
		return (): void => {
			getStyleTag().remove();
		};
	}, [colors]);
};

export const useSidebarPaletteColor = isIE11
	? useSidebarPaletteColorIE11
	: (): void => {
			const colors = useTheme();
			useLayoutEffect(() => {
				getStyleTag().innerHTML = getStyle(colors);

				return (): void => {
					getStyleTag().innerHTML = '';
				};
			}, [colors]);
	  };
