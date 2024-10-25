import { useEndpoint, useToastMessageDispatch, useUserId } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { Meteor } from 'meteor/meteor';
import { useTranslation } from 'react-i18next';

import { ChatSubscription } from '../../../../app/models/client';

export const useToggleFavoriteMutation = () => {
	const userId = useUserId();
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const toggleFavorite = useEndpoint('POST', '/v1/rooms.favorite');

	return useMutation(
		async ({ roomId, favorite }: { roomId: string; favorite: boolean; roomName: string }) => {
			if (!userId) {
				throw new Meteor.Error('error-not-authorized', 'Not authorized', {
					mutation: 'toggleFavorite',
				});
			}

			await toggleFavorite({ roomId, favorite });
		},
		{
			onSuccess: (_data, { roomId, favorite, roomName }) => {
				ChatSubscription.update(
					{
						'rid': roomId,
						'u._id': userId,
					},
					{
						$set: {
							f: favorite,
						},
					},
				);
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
