import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { HeaderState } from '@rocket.chat/ui-client';
import { useSetting, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import { useUserIsSubscribed } from '../../contexts/RoomContext';

const Favorite = ({ room: { _id, f: favorite = false, t: type, name } }: { room: IRoom & { f?: ISubscription['f'] } }) => {
	const t = useTranslation();
	const subscribed = useUserIsSubscribed();

	const isFavoritesEnabled = useSetting('Favorite_Rooms') && ['c', 'p', 'd', 't'].includes(type);
	const toggleFavorite = useMethod('toggleFavorite');

	const handleFavoriteClick = useEffectEvent(() => {
		if (!isFavoritesEnabled) {
			return;
		}

		toggleFavorite(_id, !favorite);
	});

	const favoriteLabel = favorite ? `${t('Unfavorite')} ${name}` : `${t('Favorite')} ${name}`;

	if (!subscribed || !isFavoritesEnabled) {
		return null;
	}

	return (
		<HeaderState
			title={favoriteLabel}
			aria-live='assertive'
			icon={favorite ? 'star-filled' : 'star'}
			onClick={handleFavoriteClick}
			color={favorite ? 'status-font-on-warning' : null}
			tiny
		/>
	);
};

export default memo(Favorite);
