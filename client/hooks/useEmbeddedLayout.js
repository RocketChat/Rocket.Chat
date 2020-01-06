import { useQueryStringParameter } from '../components/providers/RouterProvider';

export const useEmbeddedLayout = () => useQueryStringParameter('layout') === 'embedded';
