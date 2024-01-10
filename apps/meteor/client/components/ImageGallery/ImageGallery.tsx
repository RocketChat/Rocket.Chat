import React, { useContext, useMemo } from 'react';

import { ImageGalleryContext } from '../../contexts/ImageGalleryContext';
import { useRecordList } from '../../hooks/lists/useRecordList';
import { useRoom } from '../../views/room/contexts/RoomContext';
import ImageGalleryLoader from './ImageGalleryLoader';
import ImageGallerySwiper from './ImageGallerySwiper';
import { useImagesList } from './hooks/useImagesList';

const ImageGallery = () => {
	const { _id: rid } = useRoom();
	const { imageId, onClose } = useContext(ImageGalleryContext);

	const { filesList, loadMoreItems } = useImagesList(useMemo(() => ({ roomId: rid, startingFromId: imageId }), [imageId, rid]));
	const { phase, items: images, error } = useRecordList(filesList);

	if (error && imageId) {
		return <ImageGallerySwiper images={[{ _id: imageId, url: imageId }]} onClose={onClose} />;
	}

	if (phase === 'loading') {
		return <ImageGalleryLoader onClose={onClose} />;
	}

	return <ImageGallerySwiper images={images} loadMore={() => loadMoreItems(images.length - 1)} onClose={onClose} />;
};

export default ImageGallery;
