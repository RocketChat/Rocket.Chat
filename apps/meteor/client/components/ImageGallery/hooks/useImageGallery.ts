import { useState, useEffect, useMemo, useContext } from 'react';

import { ImageGalleryContext } from '../../../contexts/ImageGalleryContext';
import { useRecordList } from '../../../hooks/lists/useRecordList';
import { useRoom } from '../../../views/room/contexts/RoomContext';
import { useFilesList } from '../../../views/room/contextualBar/RoomFiles/hooks/useFilesList';

export const useImageGallery = () => {
	const { _id: rid } = useRoom();
	const { imageUrl, onClose } = useContext(ImageGalleryContext);
	const [images, setImages] = useState<string[]>([]);
	const [currentSlide, setCurrentSlide] = useState<number>();

	const { filesList, loadMoreItems } = useFilesList(useMemo(() => ({ rid, type: 'image', text: '' }), [rid]));
	const { phase, items: filesItems } = useRecordList(filesList);

	useEffect(() => {
		if (phase === 'resolved') {
			setImages(filesItems.map((item) => item.url || '').filter(Boolean));
			setCurrentSlide(filesItems.findIndex((item) => imageUrl?.includes(item._id)));
		}
	}, [filesItems, phase, imageUrl]);

	return {
		images,
		isLoading: phase === 'loading' || currentSlide === undefined,
		loadMore: () => loadMoreItems(filesItems.length - (currentSlide || 0), filesItems.length + 5),
		currentSlide,
		onClose,
	};
};
