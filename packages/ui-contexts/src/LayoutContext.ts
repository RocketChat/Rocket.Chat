import { createContext } from 'react';

export type LayoutContextValue = {
	isEmbedded: boolean;
	showTopNavbarEmbeddedLayout: boolean;
	isMobile: boolean;
	roomToolboxExpanded: boolean;
	sidebar: {
		size: string;
		isCollapsed: boolean;
		toggle: () => void;
		collapse: () => void;
		expand: () => void;
		close: () => void;
	};
	contextualbar: {
		size: string;
		canExpand: boolean;
		position: 'absolute' | 'relative' | 'fixed';
	};
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
	isMobile: false,
	roomToolboxExpanded: true,
	sidebar: {
		size: '240px',
		isCollapsed: false,
		toggle: () => undefined,
		collapse: () => undefined,
		expand: () => undefined,
		close: () => undefined,
	},
	contextualbar: {
		size: '380px',
		position: 'relative',
		canExpand: false,
	},
	hiddenActions: {
		roomToolbox: [],
		messageToolbox: [],
		composerToolbox: [],
		userToolbox: [],
	},
});
