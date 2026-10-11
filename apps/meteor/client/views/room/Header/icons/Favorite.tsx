import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { IconButton } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import { useToggleFavoriteMutation } from '../../hooks/useToggleFavoriteMutation';

export type FavoriteProps = { room: IRoom & { f?: ISubscription['f'] } };

const Favorite = ({ room: { _id, f: favorite = false, t: type, name } }: FavoriteProps) => {
	const t = useTranslation();

	const isFavoritesEnabled = useSetting('Favorite_Rooms', true) && ['c', 'p', 'd', 't'].includes(type);
	const { mutate: toggleFavorite } = useToggleFavoriteMutation();

	const handleFavoriteClick = useStableCallback(() => {
		if (!isFavoritesEnabled) {
			return;
		}

		toggleFavorite({ roomId: _id, favorite: !favorite, roomName: name || '' });
	});

	const favoriteLabel = favorite ? `${t('Unfavorite')} ${name}` : `${t('Favorite')} ${name}`;

	if (!isFavoritesEnabled) {
		return null;
	}

	return (
		<IconButton
			small
			marginInlineEnd={4}
			icon={favorite ? 'star-filled' : 'star'}
			title={favoriteLabel}
			color={favorite ? 'status-font-on-warning' : undefined}
			onClick={handleFavoriteClick}
		/>
	);
};

export default memo(Favorite);
