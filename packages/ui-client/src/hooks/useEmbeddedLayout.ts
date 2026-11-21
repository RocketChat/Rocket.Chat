import { useEmbedding } from '@rocket.chat/ui-contexts';

export const useEmbeddedLayout = () => useEmbedding().isEmbedded;
