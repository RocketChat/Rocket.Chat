import React, { type ReactNode, useEffect, useState } from 'react';

import ImageGallery from '../components/ImageGallery/ImageGallery';
import { ImageGalleryContext } from '../contexts/ImageGalleryContext';

type ImageGalleryProviderProps = {
	children: ReactNode;
	imageSelector?: string;
	containerSelector?: string;
};

const ImageGalleryProvider = ({ children, imageSelector, containerSelector }: ImageGalleryProviderProps) => {
	const [imageUrl, setImageUrl] = useState<string>();

	useEffect(() => {
		document.addEventListener('click', (event: Event) => {
			const target = event?.target as HTMLElement | null;

			if (target?.classList.contains('gallery-item')) {
				return setImageUrl(target.dataset.src || target?.parentElement?.parentElement?.querySelector('img')?.src);
			}

			if (target?.classList.contains('gallery-item-container')) {
				return setImageUrl((target.querySelector('img.rcx-avatar__element') as HTMLImageElement | null)?.src);
			}
			if (
				target?.classList.contains('gallery-item') &&
				target?.parentElement?.parentElement?.classList.contains('gallery-item-container')
			) {
				return setImageUrl((target.parentElement.parentElement.querySelector('img.rcx-avatar__element') as HTMLImageElement | null)?.src);
			}

			if (target?.classList.contains('rcx-avatar__element') && target?.parentElement?.classList.contains('gallery-item')) {
				return setImageUrl((target as HTMLImageElement).src);
			}
		});
	}, [containerSelector, imageSelector]);

	return (
		<ImageGalleryContext.Provider value={{ imageUrl: imageUrl || '', isOpen: !!imageUrl, onClose: () => setImageUrl(undefined) }}>
			{children}
			{!!imageUrl && <ImageGallery />}
		</ImageGalleryContext.Provider>
	);
};

export default ImageGalleryProvider;
