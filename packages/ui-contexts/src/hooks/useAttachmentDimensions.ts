import { useContext } from 'react';

import { AttachmentContext } from '../AttachmentContext';

export const useAttachmentDimensions = (): {
	width: number;
	height: number;
} => useContext(AttachmentContext).dimensions;
