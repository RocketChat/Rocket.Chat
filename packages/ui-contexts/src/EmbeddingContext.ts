import { createContext } from 'react';

export type EmbeddingContextValue = {
	isEmbedded: boolean;
	showTopNavbarEmbeddedLayout: boolean;
	hiddenActions: {
		roomToolbox: Array<string>;
		messageToolbox: Array<string>;
		composerToolbox: Array<string>;
		userToolbox: Array<string>;
	};
};

/**
 * What the page hosting the app, when it runs inside another site, asks of it.
 */
export const EmbeddingContext = createContext<EmbeddingContextValue>({
	isEmbedded: false,
	showTopNavbarEmbeddedLayout: false,
	hiddenActions: {
		roomToolbox: [],
		messageToolbox: [],
		composerToolbox: [],
		userToolbox: [],
	},
});
