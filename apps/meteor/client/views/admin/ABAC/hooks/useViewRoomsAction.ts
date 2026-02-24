import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouter } from '@rocket.chat/ui-contexts';

export const useViewRoomsAction = () => {
	const router = useRouter();
	return useEffectEvent((key: string) => {
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
