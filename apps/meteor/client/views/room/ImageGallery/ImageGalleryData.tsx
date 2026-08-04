import { useContext } from 'react';

import { useImagesList } from './hooks/useImagesList';
import { ImageGallery, ImageGalleryError, ImageGalleryLoading } from '../../../components/ImageGallery';
import { ImageGalleryContext } from '../../../contexts/ImageGalleryContext';
import { useRoom } from '../contexts/RoomContext';

const ImageGalleryData = () => {
	const { _id: rid } = useRoom();

	const { imageId, onClose } = useContext(ImageGalleryContext);

	const { isPending, isError, data: images, fetchNextPage } = useImagesList({ roomId: rid, startingFromId: imageId });

	if (isPending) {
		return <ImageGalleryLoading onClose={onClose} />;
	}

	if (isError) {
		return <ImageGalleryError onClose={onClose} />;
	}

	return <ImageGallery images={images} loadMore={fetchNextPage} onClose={onClose} />;
};

export default ImageGalleryData;
