import { type ReactNode, lazy, Suspense, useEffect, useState } from 'react';

import { ImageGalleryLoading } from '../components/ImageGallery/ImageGalleryLoading';
import { ImageGalleryContext } from '../contexts/ImageGalleryContext';

const ImageGallery = lazy(() => import('../components/ImageGallery/ImageGallery').then(({ ImageGallery }) => ({ default: ImageGallery })));
const ImageGalleryData = lazy(() => import('../views/room/ImageGallery/ImageGalleryData'));

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
				<Suspense fallback={<ImageGalleryLoading onClose={() => setSingleImageUrl(undefined)} />}>
					<ImageGallery images={[{ _id: singleImageUrl, url: singleImageUrl }]} onClose={() => setSingleImageUrl(undefined)} />
				</Suspense>
			)}
			{!!imageId && (
				<Suspense fallback={<ImageGalleryLoading onClose={() => setImageId(undefined)} />}>
					<ImageGalleryData />
				</Suspense>
			)}
		</ImageGalleryContext.Provider>
	);
};

export default ImageGalleryProvider;
