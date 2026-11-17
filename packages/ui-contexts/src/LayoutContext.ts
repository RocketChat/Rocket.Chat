import { createContext } from 'react';

export type SizeLayout = {
	sidebar: string;
	contextualBar: string;
};

export type LayoutContextValue = {
	isTablet: boolean;
	isMobile: boolean;
	roomToolboxExpanded: boolean;
	sidebar: {
		overlayed: boolean;
		setOverlayed: (value: boolean) => void;
		isCollapsed: boolean;
		shouldToggle: boolean;
		toggle: () => void;
		collapse: () => void;
		expand: () => void;
		close: () => void;
	};
	sidePanel: {
		displaySidePanel: boolean;
		closeSidePanel: () => void;
		openSidePanel: () => void;
	};
	navbar: {
		searchExpanded: boolean;
		expandSearch?: () => void;
		collapseSearch?: () => void;
	};
	size: SizeLayout;
	contextualBarExpanded: boolean;
	contextualBarPosition: 'absolute' | 'relative' | 'fixed';
};

export const LayoutContext = createContext<LayoutContextValue>({
	isTablet: false,
	isMobile: false,
	roomToolboxExpanded: true,
	navbar: {
		searchExpanded: false,
		expandSearch: () => undefined,
		collapseSearch: () => undefined,
	},
	sidebar: {
		overlayed: false,
		setOverlayed: () => undefined,
		isCollapsed: false,
		shouldToggle: false,
		toggle: () => undefined,
		collapse: () => undefined,
		expand: () => undefined,
		close: () => undefined,
	},
	sidePanel: {
		displaySidePanel: true,
		closeSidePanel: () => undefined,
		openSidePanel: () => undefined,
	},
	size: {
		sidebar: '240px',
		contextualBar: '380px',
	},
	contextualBarPosition: 'relative',
	contextualBarExpanded: false,
});
