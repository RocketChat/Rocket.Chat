import type { RoomType } from '@rocket.chat/core-typings';
import { useRoute } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { openRoom } from '../../../../app/ui-utils/client/lib/openRoom';

export function useOpenRoom({ type, reference }: { type: RoomType; reference: string }) {
	const directRoute = useRoute('direct');

	return useQuery(['rooms', { type, ref: reference }], () => openRoom(type, reference), {
		onSuccess: (data) => {
			if ('type' in data && 'id' in data && data.type === 'd') {
				directRoute.push({ rid: data.id });
			}
		},
	});
}
