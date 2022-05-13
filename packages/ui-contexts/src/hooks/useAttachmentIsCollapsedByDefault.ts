import { useContext } from 'react';

import { AttachmentContext } from '../AttachmentContext';

export const useAttachmentIsCollapsedByDefault = (): boolean => useContext(AttachmentContext).collapsedByDefault;
