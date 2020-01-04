import { useQueryStringParameter } from '../contexts/RouterContext';

export const useEmbeddedLayout = () => useQueryStringParameter('layout') === 'embedded';
