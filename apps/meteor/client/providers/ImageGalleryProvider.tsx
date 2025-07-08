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
				/**
				 * When sharing multiple files, the preview incorrectly always showed the first image.
				 * This was add to ensure the clicked image is displayed in the preview.
				 * ROOT CAUSE: `RoomMessageContent` component was only passing the first file ID to attachment elements.
				 * SOLUTION: We likely need to store the individual file ID within each attachment element
				 * and use the initially passed first ID as a fallback for older records.
				 */
				const idFromSrc = target.dataset.src?.split('/file-upload/')[1]?.split('/')[0];

				const id = target.closest('.gallery-item-container')?.getAttribute('data-id') || undefined;
				return setImageId(idFromSrc || target.dataset.id || id);
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
