import { global } from '@storybook/global';
import { MoonIcon, SunIcon } from '@storybook/icons';
import equal from 'fast-deep-equal';
import * as React from 'react';
import { IconButton } from 'storybook/internal/components';
import { STORY_CHANGED, SET_STORIES, DOCS_RENDERED } from 'storybook/internal/core-events';
import type { API } from 'storybook/manager-api';
import { useParameter } from 'storybook/manager-api';
import type { ThemeVars } from 'storybook/theming';
import { themes } from 'storybook/theming';

import { DARK_MODE_EVENT_NAME, UPDATE_DARK_MODE_EVENT_NAME } from './constants';

const { document, window } = global as { document: Document; window: Window };
type Mode = 'light' | 'dark';

type DarkModeStore = {
	/** The class target in the preview iframe */
	classTarget: string;
	/** The current mode the storybook is set to */
	current: Mode;
	/** The dark theme for storybook */
	dark: ThemeVars;
	/** The dark class name for the preview iframe */
	darkClass: string | string[];
	/** The light theme for storybook */
	light: ThemeVars;
	/** The light class name for the preview iframe */
	lightClass: string | string[];
	/** Apply mode to iframe */
	stylePreview: boolean;
	/** Persist if the user has set the theme */
	userHasExplicitlySetTheTheme: boolean;
};

const STORAGE_KEY = 'sb-addon-themes-3';
export const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)');

const defaultParams: Required<Omit<DarkModeStore, 'current'>> = {
	classTarget: 'body',
	dark: themes.dark,
	darkClass: ['dark'],
	light: themes.light,
	lightClass: ['light'],
	stylePreview: false,
	userHasExplicitlySetTheTheme: false,
};

/** Persist the dark mode settings in localStorage */
export const updateStore = (newStore: DarkModeStore) => {
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newStore));
};

/** Add the light/dark class to an element */
const toggleDarkClass = (
	el: Element,
	{ current, darkClass = defaultParams.darkClass, lightClass = defaultParams.lightClass }: DarkModeStore,
) => {
	if (current === 'dark') {
		el.classList.remove(...arrayify(lightClass));
		el.classList.add(...arrayify(darkClass));
	} else {
		el.classList.remove(...arrayify(darkClass));
		el.classList.add(...arrayify(lightClass));
	}
};

/** Coerce a string to a single item array, or return an array as-is */
const arrayify = (classes: string | string[]): string[] => {
	const arr: string[] = [];
	return arr.concat(classes).map((item) => item);
};

/** Update the preview iframe class */
const updatePreview = (store: DarkModeStore) => {
	const iframe = document.getElementById('storybook-preview-iframe') as HTMLIFrameElement;

	if (!iframe) {
		return;
	}

	const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
	const target = iframeDocument?.querySelector<HTMLElement>(store.classTarget);

	if (!target) {
		return;
	}

	toggleDarkClass(target, store);
};

/** Update the manager iframe class */
const updateManager = (store: DarkModeStore) => {
	const manager = document.querySelector(store.classTarget);

	if (!manager) {
		return;
	}

	toggleDarkClass(manager, store);
};

/** Update changed dark mode settings and persist to localStorage  */
export const store = (userTheme: Partial<DarkModeStore> = {}): DarkModeStore => {
	const storedItem = window.localStorage.getItem(STORAGE_KEY);

	if (typeof storedItem === 'string') {
		const stored = JSON.parse(storedItem) as DarkModeStore;

		if (userTheme) {
			if (userTheme.dark && !equal(stored.dark, userTheme.dark)) {
				stored.dark = userTheme.dark;
				updateStore(stored);
			}

			if (userTheme.light && !equal(stored.light, userTheme.light)) {
				stored.light = userTheme.light;
				updateStore(stored);
			}
		}

		return stored;
	}

	return { ...defaultParams, ...userTheme } as DarkModeStore;
};

// On initial load, set the dark mode class on the manager
// This is needed if you're using mostly CSS overrides to styles the storybook
// Otherwise the default theme is set in src/preset/manager.tsx
updateManager(store());

type DarkModeProps = {
	/** The storybook API */
	api: API;
};

/** A toolbar icon to toggle between dark and light themes in storybook */
export function DarkMode({ api }: DarkModeProps) {
	const [isDark, setDark] = React.useState(prefersDark.matches);
	const darkModeParams = useParameter<Partial<DarkModeStore>>('darkMode', {});
	const { current: defaultMode, stylePreview, ...params } = darkModeParams;
	const channel = api.getChannel();
	// Save custom themes on init
	const userHasExplicitlySetTheTheme = React.useMemo(() => store(params).userHasExplicitlySetTheTheme, [params]);
	/** Set the theme in storybook, update the local state, and emit an event */
	const setMode = React.useCallback(
		(mode: Mode) => {
			const currentStore = store();
			api.setOptions({ theme: currentStore[mode] });
			setDark(mode === 'dark');
			api.getChannel()?.emit(DARK_MODE_EVENT_NAME, mode === 'dark');
			updateManager(currentStore);
			if (stylePreview) {
				updatePreview(currentStore);
			}
		},
		[api, stylePreview],
	);

	/** Update the theme settings in localStorage, react, and storybook */
	const updateMode = React.useCallback(
		(mode?: Mode) => {
			const currentStore = store();
			const current = mode || (currentStore.current === 'dark' ? 'light' : 'dark');
			updateStore({ ...currentStore, current });
			setMode(current);
		},
		[setMode],
	);

	/** Update the theme based on the color preference */
	function prefersDarkUpdate(event: MediaQueryListEvent) {
		if (userHasExplicitlySetTheTheme || defaultMode) {
			return;
		}

		updateMode(event.matches ? 'dark' : 'light');
	}

	/** Render the current theme */
	const renderTheme = React.useCallback(() => {
		const { current = 'light' } = store();
		setMode(current);
	}, [setMode]);

	/** Handle the user event and side effects */
	const handleIconClick = () => {
		updateMode();
		const currentStore = store();
		updateStore({ ...currentStore, userHasExplicitlySetTheTheme: true });
	};

	/** When storybook params change update the stored themes */
	React.useEffect(() => {
		const currentStore = store();
		// Ensure we use the stores `current` value first to persist
		// themeing between page loads and story changes.
		updateStore({
			...currentStore,
			...darkModeParams,
			current: currentStore.current || darkModeParams.current,
		});
		renderTheme();
	}, [darkModeParams, renderTheme]);
	React.useEffect(() => {
		channel?.on(STORY_CHANGED, renderTheme);
		channel?.on(SET_STORIES, renderTheme);
		channel?.on(DOCS_RENDERED, renderTheme);
		prefersDark.addListener(prefersDarkUpdate);
		return () => {
			channel?.removeListener(STORY_CHANGED, renderTheme);
			channel?.removeListener(SET_STORIES, renderTheme);
			channel?.removeListener(DOCS_RENDERED, renderTheme);
			prefersDark.removeListener(prefersDarkUpdate);
		};
	});
	React.useEffect(() => {
		channel?.on(UPDATE_DARK_MODE_EVENT_NAME, updateMode);
		return () => {
			channel?.removeListener(UPDATE_DARK_MODE_EVENT_NAME, updateMode);
		};
	});
	// Storybook's first render doesn't have the global user params loaded so we
	// need the effect to run whenever defaultMode is updated
	React.useEffect(() => {
		// If a users has set the mode this is respected
		if (userHasExplicitlySetTheTheme) {
			return;
		}

		if (defaultMode) {
			updateMode(defaultMode);
		} else if (prefersDark.matches) {
			updateMode('dark');
		}
	}, [defaultMode, updateMode, userHasExplicitlySetTheTheme]);
	return (
		<IconButton key='dark-mode' title={isDark ? 'Change theme to light mode' : 'Change theme to dark mode'} onClick={handleIconClick}>
			{isDark ? <SunIcon aria-hidden='true' /> : <MoonIcon aria-hidden='true' />}
		</IconButton>
	);
}

export default DarkMode;
