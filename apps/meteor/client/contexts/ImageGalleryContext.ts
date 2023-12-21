import { createContext } from 'react';

export type ImageGalleryContextValue = {
	imageId: string;
	isOpen: boolean;
	onClose: () => void;
};

export const ImageGalleryContext = createContext<ImageGalleryContextValue>({
	imageId: '',
	isOpen: false,
	onClose: () => undefined,
});
