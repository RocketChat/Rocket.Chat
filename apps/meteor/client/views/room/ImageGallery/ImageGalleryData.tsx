import { useContext, useMemo } from 'react';

import { ImageGallery, ImageGalleryError, ImageGalleryLoading } from '../../../components/ImageGallery';
import { ImageGalleryContext } from '../../../contexts/ImageGalleryContext';
import { useRecordList } from '../../../hooks/lists/useRecordList';
import { useRoom } from '../contexts/RoomContext';
import { useImagesList } from './hooks/useImagesList';

const ImageGalleryData = () => {
	const { _id: rid } = useRoom();

	const { imageId, onClose } = useContext(ImageGalleryContext);

	const { filesList, loadMoreItems } = useImagesList(useMemo(() => ({ roomId: rid, startingFromId: imageId }), [imageId, rid]));
	const { phase, items: images, error } = useRecordList(filesList);

	if (error) {
		return <ImageGalleryError onClose={onClose} />;
	}

	if (phase === 'loading') {
		return <ImageGalleryLoading onClose={onClose} />;
	}

	return <ImageGallery images={images} loadMore={() => loadMoreItems(images.length - 1)} onClose={onClose} />;
};

export default ImageGalleryData;
