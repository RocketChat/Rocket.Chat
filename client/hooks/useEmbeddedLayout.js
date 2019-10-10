import { useQueryStringParameter } from '../components/contexts/RouterContext';

export const useEmbeddedLayout = () => useQueryStringParameter('layout') === 'embedded';
