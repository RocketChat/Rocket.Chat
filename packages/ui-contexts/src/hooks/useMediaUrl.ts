import { useContext } from 'react';

import { AttachmentContext } from '../AttachmentContext';

export const useMediaUrl = (): ((path: string) => string) => {
	const { getURL } = useContext(AttachmentContext);
	return getURL;
};
