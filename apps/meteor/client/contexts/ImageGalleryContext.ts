import { createContext } from 'react';

export type ImageGalleryContextValue = {
	imageUrl: string;
	isOpen: boolean;
	onClose: () => void;
};

export const ImageGalleryContext = createContext<ImageGalleryContextValue>({
	imageUrl: '',
	isOpen: false,
	onClose: () => undefined,
});
