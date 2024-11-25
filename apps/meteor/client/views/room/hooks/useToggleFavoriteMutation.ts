import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { toggleFavoriteRoom } from '../../../lib/mutationEffects/room';

export const useToggleFavoriteMutation = () => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const toggleFavorite = useEndpoint('POST', '/v1/rooms.favorite');

	return useMutation(
		async ({ roomId, favorite }: { roomId: string; favorite: boolean; roomName: string }) => {
			await toggleFavorite({ roomId, favorite });
		},
		{
			onSuccess: (_data, { roomId, favorite, roomName }) => {
				toggleFavoriteRoom(roomId, favorite);
				dispatchToastMessage({
					type: 'success',
					message: favorite
						? t('__roomName__was_added_to_favorites', { roomName })
						: t('__roomName__was_removed_from_favorites', { roomName }),
				});
			},
			onError: (error) => {
				dispatchToastMessage({ type: 'error', message: error });
			},
		},
	);
};
