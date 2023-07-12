import { router } from '../../providers/RouterProvider';

export const isLayoutEmbedded = (): boolean => router.getSearchParameters().layout === 'embedded';
