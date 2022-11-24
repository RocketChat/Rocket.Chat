import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { Header } from '@rocket.chat/ui-client';
import { useSetting, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import { useUserIsSubscribed } from '../../contexts/RoomContext';

const Favorite = ({ room: { _id, f: favorite = false, t: type } }) => {
	const subscribed = useUserIsSubscribed();

	const t = useTranslation();
	const isFavoritesEnabled = useSetting('Favorite_Rooms') && ['c', 'p', 'd', 't'].includes(type);
	const toggleFavorite = useMethod('toggleFavorite');
	const handleFavoriteClick = useMutableCallback(() => {
		if (!isFavoritesEnabled) {
			return;
		}
		toggleFavorite(_id, !favorite);
	});
	const favoriteLabel = favorite ? t('Unfavorite') : t('Favorite');

	if (!subscribed || !isFavoritesEnabled) {
		return null;
	}

	return (
		isFavoritesEnabled && (
			<Header.State
				title={favoriteLabel}
				icon={favorite ? 'star-filled' : 'star'}
				onClick={handleFavoriteClick}
				color={favorite ? colors.w500 : null}
				tiny
			/>
		)
	);
};

export default memo(Favorite);
