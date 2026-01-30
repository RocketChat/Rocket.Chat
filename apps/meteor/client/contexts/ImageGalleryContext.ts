import { createContext } from 'react';

type ImageGalleryContextValue = {
	imageId: string;
	isOpen: boolean;
	onClose: () => void;
};

export const ImageGalleryContext = createContext<ImageGalleryContextValue>({
	imageId: '',
	isOpen: false,
	onClose: () => undefined,
});
