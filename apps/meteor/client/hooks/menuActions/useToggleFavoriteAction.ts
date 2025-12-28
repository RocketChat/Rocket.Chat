import type { IRoom } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';

export const useToggleFavoriteAction = ({ rid, isFavorite }: { rid: IRoom['_id']; isFavorite: boolean }) => {
	const toggleFavorite = useEndpoint('POST', '/v1/rooms.favorite');
	const dispatchToastMessage = useToastMessageDispatch();

	const handleToggleFavorite = useEffectEvent(async () => {
		try {
			await toggleFavorite({ roomId: rid, favorite: !isFavorite });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return handleToggleFavorite;
};
