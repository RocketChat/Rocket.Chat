import { createContext } from 'react';

export type AttachmentContextValue = {
	getURL: (url: string) => string;
	dimensions: {
		width: number;
		height: number;
	};
	collapsedByDefault: boolean;
	autoLoadEmbedMedias: boolean;
};

export const AttachmentContext = createContext<AttachmentContextValue>({
	getURL: (url: string) => url,
	dimensions: {
		width: 480,
		height: 360,
	},
	collapsedByDefault: false,
	autoLoadEmbedMedias: true,
});
