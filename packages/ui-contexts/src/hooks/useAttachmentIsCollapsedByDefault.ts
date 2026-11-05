import { useContext } from 'react';

import { AttachmentContext } from '../AttachmentContext.js';

export const useAttachmentIsCollapsedByDefault = (): boolean => useContext(AttachmentContext).collapsedByDefault;
