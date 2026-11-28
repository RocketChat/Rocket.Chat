import { useContext } from 'react';

import { useImagesList } from './hooks/useImagesList';
import { ImageGallery, ImageGalleryError, ImageGalleryLoading } from '../../../components/ImageGallery';
import { ImageGalleryContext } from '../../../contexts/ImageGalleryContext';
import { useRoom } from '../contexts/RoomContext';

const ImageGalleryData = () => {
	const { _id: rid } = useRoom();

	const { imageId, onClose } = useContext(ImageGalleryContext);

	const older = useImagesList({ roomId: rid, startingFromId: imageId, direction: 'older' });
	const newer = useImagesList({ roomId: rid, startingFromId: imageId, direction: 'newer' });

	if (older.isPending || newer.isPending) {
		return <ImageGalleryLoading onClose={onClose} />;
	}

	if (older.isError || newer.isError) {
		return <ImageGalleryError onClose={onClose} />;
	}

	const images = [...older.data].reverse().concat(newer.data);

	const loadOlder = () => {
		if (older.hasNextPage && !older.isFetchingNextPage) {
			older.fetchNextPage();
		}
	};

	const loadNewer = () => {
		if (newer.hasNextPage && !newer.isFetchingNextPage) {
			newer.fetchNextPage();
		}
	};

	return <ImageGallery images={images} initialImageId={imageId} loadPrevious={loadOlder} loadNext={loadNewer} onClose={onClose} />;
};

export default ImageGalleryData;
