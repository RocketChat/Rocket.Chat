import { createContext, useContext } from 'react';

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

export const useMediaUrl = (): ((path: string) => string) => {
	const { getURL } = useContext(AttachmentContext);
	return getURL;
};

export const useAttachmentDimensions = (): {
	width: number;
	height: number;
} => useContext(AttachmentContext).dimensions;

export const useAttachmentIsCollapsedByDefault = (): boolean => useContext(AttachmentContext).collapsedByDefault;
export const useAttachmentAutoLoadEmbedMedia = (): boolean => useContext(AttachmentContext).autoLoadEmbedMedias;
