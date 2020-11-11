import { createContext, useContext } from 'react';

type LayoutContextValue = {
	isEmbedded: boolean;
	showTopNavbarEmbeddedLayout: boolean;
	isMobile: boolean;
	sidebar: any;
}

export const LayoutContext = createContext<LayoutContextValue>({
	isEmbedded: false,
	showTopNavbarEmbeddedLayout: false,
	isMobile: false,
	sidebar: {},
});

export const useLayout = (): LayoutContextValue =>
	useContext(LayoutContext);
