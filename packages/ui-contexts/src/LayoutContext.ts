import { createContext } from 'react';

export type SizeLayout = {
	sidebar: string;
	contextualBar: string;
};

export type LayoutContextValue = {
	isEmbedded: boolean;
	showTopNavbarEmbeddedLayout: boolean;
	isTablet: boolean;
	isMobile: boolean;
	roomToolboxExpanded: boolean;
	sidebar: {
		isCollapsed: boolean;
		toggle: () => void;
		collapse: () => void;
		expand: () => void;
		close: () => void;
	};
	navbar: {
		searchExpanded: boolean;
		expandSearch?: () => void;
		collapseSearch?: () => void;
	};
	size: SizeLayout;
	contextualBarExpanded: boolean;
	contextualBarPosition: 'absolute' | 'relative' | 'fixed';
	hiddenActions: {
		roomToolbox: Array<string>;
		messageToolbox: Array<string>;
		composerToolbox: Array<string>;
		userToolbox: Array<string>;
	};
};

export const LayoutContext = createContext<LayoutContextValue>({
	isEmbedded: false,
	showTopNavbarEmbeddedLayout: false,
	isTablet: false,
	isMobile: false,
	roomToolboxExpanded: true,
	navbar: {
		searchExpanded: false,
		expandSearch: () => undefined,
		collapseSearch: () => undefined,
	},
	sidebar: {
		isCollapsed: false,
		toggle: () => undefined,
		collapse: () => undefined,
		expand: () => undefined,
		close: () => undefined,
	},
	size: {
		sidebar: '380px',
		contextualBar: '380px',
	},
	contextualBarPosition: 'relative',
	contextualBarExpanded: false,
	hiddenActions: {
		roomToolbox: [],
		messageToolbox: [],
		composerToolbox: [],
		userToolbox: [],
	},
});
