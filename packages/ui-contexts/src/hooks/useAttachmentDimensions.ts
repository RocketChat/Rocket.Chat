import { useContext } from 'react';

import { AttachmentContext } from '../AttachmentContext.js';

export const useAttachmentDimensions = (): {
	width: number;
	height: number;
} => useContext(AttachmentContext).dimensions;
