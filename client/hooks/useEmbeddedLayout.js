import { useQueryStringParameter } from './useQueryStringParameter';

export const useEmbeddedLayout = () => useQueryStringParameter('layout') === 'embedded';
