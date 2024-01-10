import React, { useContext, useMemo } from 'react';

import { ImageGalleryContext } from '../../contexts/ImageGalleryContext';
import { useRecordList } from '../../hooks/lists/useRecordList';
import { useRoom } from '../../views/room/contexts/RoomContext';
import ImageGallery from './ImageGallery';
import ImageGalleryLoader from './ImageGalleryLoader';
import { useImagesList } from './hooks/useImagesList';

const ImageGalleryData = () => {
	const { _id: rid } = useRoom();
	const { imageId, onClose } = useContext(ImageGalleryContext);

	const { filesList, loadMoreItems } = useImagesList(useMemo(() => ({ roomId: rid, startingFromId: imageId }), [imageId, rid]));
	const { phase, items: images } = useRecordList(filesList);

	if (phase === 'loading') {
		return <ImageGalleryLoader onClose={onClose} />;
	}

	return <ImageGallery images={images} loadMore={() => loadMoreItems(images.length - 1)} onClose={onClose} />;
};

export default ImageGalleryData;
