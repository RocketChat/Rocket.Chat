import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import { HeaderState } from '../../../../components/Header';
import { useUserIsSubscribed } from '../../contexts/RoomContext';
import { useToggleFavoriteMutation } from '../../hooks/useToggleFavoriteMutation';

const Favorite = ({ room: { _id, f: favorite = false, t: type, name } }: { room: IRoom & { f?: ISubscription['f'] } }) => {
	const t = useTranslation();
	const subscribed = useUserIsSubscribed();

	const isFavoritesEnabled = useSetting('Favorite_Rooms', true) && ['c', 'p', 'd', 't'].includes(type);
	const { mutate: toggleFavorite } = useToggleFavoriteMutation();

	const handleFavoriteClick = useEffectEvent(() => {
		if (!isFavoritesEnabled) {
			return;
		}

		toggleFavorite({ roomId: _id, favorite: !favorite, roomName: name || '' });
	});

	const favoriteLabel = favorite ? `${t('Unfavorite')} ${name}` : `${t('Favorite')} ${name}`;

	if (!subscribed || !isFavoritesEnabled) {
		return null;
	}

	return (
		<HeaderState
			title={favoriteLabel}
			icon={favorite ? 'star-filled' : 'star'}
			onClick={handleFavoriteClick}
			color={favorite ? 'status-font-on-warning' : undefined}
		/>
	);
};

export default memo(Favorite);
