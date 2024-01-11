import React, { type ReactNode, useEffect, useState } from 'react';

import ImageGallery from '../components/ImageGallery/ImageGallery';
import { ImageGalleryContext } from '../contexts/ImageGalleryContext';
import ImageGalleryData from '../views/room/ImageGallery/ImageGalleryData';

type ImageGalleryProviderProps = {
	children: ReactNode;
};

const ImageGalleryProvider = ({ children }: ImageGalleryProviderProps) => {
	const [imageId, setImageId] = useState<string>();
	const [quotedImageUrl, setQuotedImageUrl] = useState<string>();

	const handleImageClick = (event: Event) => {
		const target = event?.target as HTMLElement | null;

		if (target?.closest('.rcx-attachment__details')) {
			return setQuotedImageUrl(target.dataset.id);
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

	useEffect(() => {
		document.addEventListener('click', handleImageClick);

		return () => document.removeEventListener('click', handleImageClick);
	}, []);

	return (
		<ImageGalleryContext.Provider value={{ imageId: imageId || '', isOpen: !!imageId, onClose: () => setImageId(undefined) }}>
			{children}
			{!!quotedImageUrl && (
				<ImageGallery images={[{ _id: quotedImageUrl, url: quotedImageUrl }]} onClose={() => setQuotedImageUrl(undefined)} />
			)}
			{!!imageId && <ImageGalleryData />}
		</ImageGalleryContext.Provider>
	);
};

export default ImageGalleryProvider;
