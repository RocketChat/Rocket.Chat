import type { IUpload } from '@rocket.chat/core-typings';
import { createContext } from 'react';

type ImageGalleryContextValue = {
	imageId?: IUpload['_id'];
	isOpen: boolean;
	onClose: () => void;
};

export const ImageGalleryContext = createContext<ImageGalleryContextValue>({
	isOpen: false,
	onClose: () => undefined,
});
