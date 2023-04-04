import type { RoomType } from '@rocket.chat/core-typings';
import { useRoute } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { openRoom } from '../../app/ui-utils/client/lib/openRoom';

export function useOpenRoom({ type, ref }: { type: RoomType; ref: string }) {
	const directRoute = useRoute('direct');

	return useQuery(['rooms', { type, ref }], () => openRoom(type, ref), {
		onSuccess: (data) => {
			if ('type' in data && 'id' in data) {
				directRoute.push({ rid: data.id });
			}
		},
	});
}
