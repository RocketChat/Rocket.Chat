import { router } from '../../providers/RouterProvider';

let embedded = false;

router.subscribeToRouteChange(() => {
	embedded = router.getSearchParameters().layout === 'embedded';
});

export const isLayoutEmbedded = () => embedded;
