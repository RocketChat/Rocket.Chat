import { useLayoutEffect } from 'react';
import colors from '@rocket.chat/fuselage-tokens/colors';

import { isIE11 } from '../../../app/ui-utils/client/lib/isIE11.js';

const isInternetExplorer11 = isIE11();

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

let counter = 0;
export const useSidebarPalettColor = () => {
	useLayoutEffect(() => {
		counter++;
		if (counter === 1) {
			getStyleTag().innerText = `
			.rcx-sidebar, .sidebar--custom-colors { 
				background: var(--rcx-sidebar-background-color, var(--sidebar-background, ${ colors.n800 }));
			}

			.sidebar--custom-colors .rcx-sidebar-top-bar__title {
				color: var(--sidebar-topbar-color, var(--rooms-list-title-color, ${ colors.n600 }));
			}

			.sidebar--custom-colors .rcx-sidebar-item { 
				color: var(--rooms-list-title-color, ${ colors.n600 })
			}

			.rcx-sidebar-title,
			.rcx-sidebar-item__icon,
			.rcx-sidebar-item__time { 
				color: var(--rc-color-primary-light, ${ colors.n700 })
			}
			
			.sidebar--custom-colors .rcx-sidebar-item--clickable:hover,
			.sidebar--custom-colors .rcx-sidebar-item--clickable.hover,
			.sidebar--custom-colors .rcx-sidebar-item--clickable.is-hovered {
				background-color: var(--rcx-sidebar-item-background-color-hover, var(--sidebar-item-hover-background, ${ colors.n900 }));
			}

			.sidebar--custom-colors .rcx-sidebar-item:active,
			.sidebar--custom-colors .rcx-sidebar-item--selected {
				background-color: var(--rcx-sidebar-item-background-color-selected, ${ h2r(colors.n700, 0.4) });
			}

			.js-focus-visible .sidebar--custom-colors .rcx-sidebar-item--clickable:focus.focus-visible,
			.js-focus-visible .sidebar--custom-colors .rcx-sidebar-item--clickable.focus.focus-visible {
				box-shadow: 0 0 0 0.25rem #1f2329 inset;
				box-shadow: 0 0 0 0.25rem var(--rcx-button-colors-secondary-focus-shadow-color, var(--rcx-color-neutral-100, ${ colors.n900 })) inset;
			}

			.sidebar--custom-colors .rcx-divider {
				border-color: ${ h2r(colors.n900, 0.4) };
			}


			.sidebar--custom-colors .rcx-button--ghost {
				background: var(--rcx-sidebar-background-color, var(--sidebar-background, ${ colors.n800 }));
				color: var(--rooms-list-title-color, ${ colors.n600 })
				border-style: solid;
				appearance: none;
			}
			
			.js-focus-visible .sidebar--custom-colors .rcx-button--ghost:focus.focus-visible,
			.js-focus-visible .sidebar--custom-colors .rcx-button--ghost.focus.focus-visible {
				background-color: var(--rcx-sidebar-item-background-color-hover, var(--sidebar-item-hover-background, ${ colors.n900 }));
				background: var(--rcx-sidebar-background-color, var(--sidebar-background, ${ colors.n800 }));
				box-shadow: 0 0 0 0.25rem var(--rcx-button-colors-secondary-focus-shadow-color, var(--rcx-color-neutral-100, ${ colors.n900 }));
			}
			
			html:not(.js-focus-visible) .sidebar--custom-colors .rcx-button--ghost:focus,
			html:not(.js-focus-visible) .sidebar--custom-colors .rcx-button--ghost:focus-within,
			html:not(.js-focus-visible) .sidebar--custom-colors .rcx-button--ghost.focus,
			html:not(.js-focus-visible) .sidebar--custom-colors .rcx-button--ghost.is-focused {
				background-color: var(--rcx-sidebar-item-background-color-hover, var(--sidebar-item-hover-background, ${ colors.n900 }));
				background: var(--rcx-sidebar-background-color, var(--sidebar-background, ${ colors.n800 }));
			}
			
			.sidebar--custom-colors .rcx-button--ghost:hover,
			.sidebar--custom-colors .rcx-button--ghost.hover,
			.sidebar--custom-colors .rcx-button--ghost.is-hovered {
				background-color: var(--rcx-sidebar-item-background-color-hover, var(--sidebar-item-hover-background, ${ colors.n900 }));
				color: var(--rooms-list-title-color, ${ colors.n600 })
			}
			
			.sidebar--custom-colors .rcx-button--ghost:active,
			.sidebar--custom-colors .rcx-button--ghost.active,
			.sidebar--custom-colors .rcx-button--ghost.is-active {
				color: var(--rooms-list-title-color, ${ colors.n600 })
				background-color: var(--rooms-list-title-color, ${ colors.n600 })
			}

			.sidebar--custom-colors *:disabled .rcx-button--ghost,
			.sidebar--custom-colors .rcx-button--ghost:disabled,
			.sidebar--custom-colors .rcx-button--ghost.disabled,
			.sidebar--custom-colors .rcx-button--ghost.is-disabled {
			}



			.sidebar--custom-colors .rcx-input-box, .sidebar--custom-colors .rcx-input-box__wrapper {
				border-color: ${ colors.n500 };
				background-color: var(--rcx-sidebar-item-background-color-hover, ${ colors.n900 });
			}
			.sidebar--custom-colors .rcx-input-box:hover, .sidebar--custom-colors .rcx-input-box__wrapper:hover, .sidebar--custom-colors .hover.rcx-input-box, .sidebar--custom-colors .hover.rcx-input-box__wrapper, .sidebar--custom-colors .is-hovered.rcx-input-box, .sidebar--custom-colors .is-hovered.rcx-input-box__wrapper {
				border-color: var(--rcx-sidebar-item-background-color-hover, ${ colors.b500 });
			}
			.sidebar--custom-colors .rcx-input-box:focus, .sidebar--custom-colors .rcx-input-box__wrapper:focus, .sidebar--custom-colors .rcx-input-box:focus-within, .sidebar--custom-colors .rcx-input-box__wrapper:focus-within, .sidebar--custom-colors .focus.rcx-input-box, .sidebar--custom-colors .focus.rcx-input-box__wrapper, .sidebar--custom-colors .is-focused.rcx-input-box, .sidebar--custom-colors .is-focused.rcx-input-box__wrapper {
				border-color: var(--rcx-sidebar-item-background-color-hover, ${ colors.b500 });
				box-shadow: 0 0 0 0.25rem var(--rcx-sidebar-item-background-color-hover, ${ colors.b900 });
			}
			.sidebar--custom-colors .rcx-input-box:active, .sidebar--custom-colors .rcx-input-box__wrapper:active, .sidebar--custom-colors .active.rcx-input-box, .sidebar--custom-colors .active.rcx-input-box__wrapper, .sidebar--custom-colors .is-active.rcx-input-box, .sidebar--custom-colors .is-active.rcx-input-box__wrapper {
				border-color: var(--rcx-sidebar-item-background-color-hover,  ${ colors.b500 });;
				box-shadow: none;
			}

			
			.sidebar--custom-colors .rcx-input-box {
				color: ${ colors.n500 };
			}
			.sidebar--custom-colors .rcx-input-box + .rcx-input-box__addon {
				color: ${ colors.n500 };
			}
			.sidebar--custom-colors .rcx-input-box__wrapper.focus > .rcx-input-box {
				color: ${ colors.n500 };
			}
			.sidebar--custom-colors .rcx-input-box:focus + .rcx-input-box__addon, .sidebar--custom-colors .rcx-input-box.focus + .rcx-input-box__addon, .rcx-input-box__wrapper.focus > .sidebar--custom-colors .rcx-input-box + .rcx-input-box__addon {
				color: ${ colors.n600 };
			}
			
			.sidebar--custom-colors .rcx-input-box.rcx-input-box--placeholder-visible {
				color: ${ colors.n600 };
			}
			.sidebar--custom-colors .rcx-input-box:focus, .sidebar--custom-colors .rcx-input-box.focus {
				caret-color: ${ colors.b500 };
			}
			.sidebar--custom-colors .rcx-input-box:active, .sidebar--custom-colors .rcx-input-box.active {
				caret-color: ${ colors.b500 };
			}
		`;
		}
		// if (isInternetExplorer11) {
		const cssVars = require('css-vars-ponyfill').default;
		console.log(getStyleTag().innerText);
		cssVars({
			include: 'style#sidebar-style',
			onlyLegacy: false,
			preserveStatic: true,
			onComplete(...args) {
				// Update <code> tag with CSS result
				console.log(args);
			},
		});
		console.log(cssVars);
		// }
		return () => {
			counter--;
			if (counter === 0) {
				getStyleTag().innerText = '';
			}
		};
	}, []);
};
