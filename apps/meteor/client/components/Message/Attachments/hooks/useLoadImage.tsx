import { useCallback, useState } from 'react';

import { useAttachmentAutoLoadEmbedMedia } from '../context/AttachmentContext';

export const useLoadImage = (): [boolean, () => void] => {
	const [loadImage, setLoadImage] = useState(useAttachmentAutoLoadEmbedMedia());
	return [loadImage, useCallback(() => setLoadImage(true), [])];
};
