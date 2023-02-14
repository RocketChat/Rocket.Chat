import { useQueryStringParameter } from '@rocket.chat/ui-contexts';

export const useEmbeddedLayout = (): boolean => useQueryStringParameter('layout') === 'embedded';
