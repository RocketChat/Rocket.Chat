import { useRouter } from '@rocket.chat/ui-contexts';

export const useIsLayoutEmbedded = () => {
	const router = useRouter();

	return router.getSearchParameters().layout === 'embedded';
};
