import { useState, useEffect, useMemo } from 'react';

// import { useRoom } from '../views/room/contexts/RoomContext';
import { useRecordList } from '../../../hooks/lists/useRecordList';
import { useFilesList } from '../../../views/room/contextualBar/RoomFiles/hooks/useFilesList';

export const useImageGallery = (rid: string, imageSelector?: string, containerSelector?: string) => {
	const [images, setImages] = useState<string[]>([]);
	const [currentSlide, setCurrentSlide] = useState<number>();
	const [imageUrl, setImageUrl] = useState<string>();

	const { filesList, loadMoreItems } = useFilesList(useMemo(() => ({ rid, type: 'image', text: '' }), [rid]));
	const { phase, items: filesItems } = useRecordList(filesList);

	useEffect(() => {
		const container = containerSelector && document.querySelector(containerSelector);
		(container || document).addEventListener('click', (event: Event) => {
			const target = event?.target as HTMLElement | null;
			if (target?.classList.contains(imageSelector || 'gallery-item')) {
				target.dataset.src ? setImageUrl(target.dataset.src) : setImageUrl((target as HTMLImageElement)?.src);
			}
		});
	}, [containerSelector, imageSelector]);

	useEffect(() => {
		if (phase === 'resolved') {
			setImages(filesItems.map((item) => item.url || '').filter(Boolean));
			setCurrentSlide(filesItems.findIndex((item) => imageUrl?.includes(item._id)));
		}
	}, [filesItems, phase, imageUrl]);

	return {
		isOpen: !!imageUrl,
		images,
		isLoading: phase === 'loading' || currentSlide === undefined,
		loadMore: () => loadMoreItems(filesItems.length - (currentSlide || 0), filesItems.length + 5),
		currentSlide,
		onClose: () => setImageUrl(undefined),
	};
};
