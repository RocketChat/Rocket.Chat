import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useRouter } from '@rocket.chat/ui-contexts';

export const useViewRoomsAction = () => {
	const router = useRouter();
	return useStableCallback((key: string) => {
		return router.navigate(
			{
				name: 'admin-ABAC',
				params: {
					tab: 'rooms',
					context: '',
					id: '',
				},
				search: {
					searchTerm: key,
					type: 'attribute',
				},
			},
			{ replace: true },
		);
	});
};
