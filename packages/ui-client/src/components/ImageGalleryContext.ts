import type { ComponentType } from 'react';
import { createContext } from 'react';

export type ImageGalleryComponentProps = {
	images: { _id: string; url: string; description?: string }[];
	onClose: () => void;
};

// The gallery lives in the app (it depends on swiper), so the app provides it; without it, images are not zoomable.
export const ImageGalleryContext = createContext<ComponentType<ImageGalleryComponentProps> | undefined>(undefined);
