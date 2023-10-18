import { useState, useEffect } from 'react';

export const useImageGallery = (selector?: string, containerSelector?: string) => {
	const [imageUrl, setImageUrl] = useState<string>();

	useEffect(() => {
		const container = containerSelector && document.querySelector(containerSelector);
		(container || document).addEventListener('click', (event: Event) => {
			const target = event?.target as HTMLElement | null;
			if (target?.classList.contains(selector || 'gallery-item')) {
				target.dataset.src ? setImageUrl(target.dataset.src) : setImageUrl((target as HTMLImageElement)?.src);
			}
		});
	}, [containerSelector, selector]);

	return { imageUrl, onClose: () => setImageUrl(undefined) };
};
