import { useLayout } from '@rocket.chat/ui-contexts';

export const useEmbeddedLayout = () => useLayout().isEmbedded;
