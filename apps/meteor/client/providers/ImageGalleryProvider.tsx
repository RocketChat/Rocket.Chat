import { type ReactNode, useEffect, useState } from 'react';

import { ImageGallery } from '../components/ImageGallery';
import { ImageGalleryContext } from '../contexts/ImageGalleryContext';
import ImageGalleryData from '../views/room/ImageGallery/ImageGalleryData';

export type ImageGalleryProviderProps = {
	children: ReactNode;
};

const ImageGalleryProvider = ({ children }: ImageGalleryProviderProps) => {
	const [imageId, setImageId] = useState<string>();
	const [singleImageUrl, setSingleImageUrl] = useState<string>();

	useEffect(() => {
		const handleImageClick = (event: Event) => {
			const target = event?.target as HTMLElement | null;

			if (target?.closest('.rcx-attachment__details')) {
				return setSingleImageUrl(target.dataset.id);
			}
			if (target?.classList.contains('preview-image')) {
				return setSingleImageUrl(target.dataset.id);
			}
			const galleryItem = target?.closest<HTMLElement>('.gallery-item');
			if (galleryItem) {
				return setImageId(galleryItem.dataset.id);
			}
		};
		document.addEventListener('click', handleImageClick);

		return () => document.removeEventListener('click', handleImageClick);
	}, []);

	return (
		<ImageGalleryContext.Provider value={{ imageId: imageId || '', isOpen: !!imageId, onClose: () => setImageId(undefined) }}>
			{children}
			{!!singleImageUrl && (
				<ImageGallery images={[{ _id: singleImageUrl, url: singleImageUrl }]} onClose={() => setSingleImageUrl(undefined)} />
			)}
			{!!imageId && <ImageGalleryData />}
		</ImageGalleryContext.Provider>
	);
};

export default ImageGalleryProvider;
