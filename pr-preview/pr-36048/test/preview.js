import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/* eslint-disable @typescript-eslint/naming-convention */
import { PaletteStyleTag } from '@rocket.chat/fuselage';
import surface from '@rocket.chat/fuselage-tokens/dist/surface.json';
import { themes } from '@storybook/theming';
import { useDarkMode } from 'storybook-dark-mode';
import manifest from '../package.json';
import DocsContainer from './DocsContainer';
import logo from './logo.svg';
import '@rocket.chat/fuselage/dist/fuselage.css';
import '@rocket.chat/icons/dist/rocketchat.css';
export const parameters = {
    backgrounds: {
        grid: {
            cellSize: 4,
            cellAmount: 4,
            opacity: 0.5,
        },
    },
    options: {
        storySort: {
            method: 'alphabetical',
        },
    },
    layout: 'fullscreen',
    docs: {
        container: DocsContainer,
    },
    darkMode: {
        dark: Object.assign(Object.assign({}, themes.dark), { appBg: surface.surface.dark.sidebar, appContentBg: surface.surface.dark.light, appPreviewBg: 'transparent', barBg: surface.surface.dark.light, brandTitle: manifest.name, brandImage: logo }),
        light: Object.assign(Object.assign({}, themes.normal), { appPreviewBg: 'transparent', brandTitle: manifest.name, brandImage: logo }),
    },
};
export const decorators = [
    (Story) => {
        const dark = useDarkMode();
        return (_jsxs(_Fragment, { children: [_jsx(PaletteStyleTag, { theme: dark ? 'dark' : 'light' }), _jsx(Story, {})] }));
    },
];
//# sourceMappingURL=preview.js.map