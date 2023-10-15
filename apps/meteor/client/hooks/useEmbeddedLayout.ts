import { useLayout } from '@rocket.chat/ui-contexts';

export const useEmbeddedLayout = (): boolean => useLayout().isEmbedded;
