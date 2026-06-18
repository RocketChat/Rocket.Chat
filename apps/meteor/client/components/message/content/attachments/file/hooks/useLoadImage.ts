import { useAttachmentAutoLoadEmbedMedia } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';

export const useLoadImage = (): [boolean, () => void] => {
	const [loadImage, setLoadImage] = useState(useAttachmentAutoLoadEmbedMedia());
	return [loadImage, useCallback(() => setLoadImage(true), [])];
};
