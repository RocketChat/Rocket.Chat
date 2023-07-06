import { useSearchParameter } from '@rocket.chat/ui-contexts';

export const useEmbeddedLayout = (): boolean => useSearchParameter('layout') === 'embedded';
