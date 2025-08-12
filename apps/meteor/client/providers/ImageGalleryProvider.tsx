import { type ReactNode, useEffect, useState } from 'react';

import { ImageGallery } from '../components/ImageGallery';
import { ImageGalleryContext } from '../contexts/ImageGalleryContext';
import ImageGalleryData from '../views/room/ImageGallery/ImageGalleryData';

type ImageGalleryProviderProps = {
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
			if (target?.classList.contains('gallery-item')) {
				const id = target.closest('.gallery-item-container')?.getAttribute('data-id') || undefined;
				return setImageId(target.dataset.id || id);
			}
			if (target?.classList.contains('gallery-item-container')) {
				return setImageId(target.dataset.id);
			}
			if (target?.classList.contains('rcx-avatar__element') && target.closest('.gallery-item')) {
				const avatarTarget = target.closest('.gallery-item-container')?.getAttribute('data-id') || undefined;
				return setImageId(avatarTarget);
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
