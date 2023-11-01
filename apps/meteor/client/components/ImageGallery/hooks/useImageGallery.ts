import { useMemo, useContext } from 'react';

import { ImageGalleryContext } from '../../../contexts/ImageGalleryContext';
import { useRecordList } from '../../../hooks/lists/useRecordList';
import { useRoom } from '../../../views/room/contexts/RoomContext';
import { useImagesList } from './useImagesList';

export const useImageGallery = () => {
	const { _id: rid } = useRoom();
	const { imageId, onClose } = useContext(ImageGalleryContext);

	const { filesList, loadMoreItems } = useImagesList(useMemo(() => ({ roomId: rid, startingFromId: imageId }), [imageId, rid]));
	const { phase, items: filesItems } = useRecordList(filesList);

	return {
		images: filesItems,
		isLoading: phase === 'loading',
		loadMore: () => loadMoreItems(filesItems.length - 1),
		onClose,
	};
};
