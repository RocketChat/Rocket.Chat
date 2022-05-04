import { useQueryStringParameter } from '../contexts/RouterContext';

export const useEmbeddedLayout = (): boolean => useQueryStringParameter('layout') === 'embedded';
