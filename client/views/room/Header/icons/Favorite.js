import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import colors from '@rocket.chat/fuselage-tokens/colors';
import React, { memo } from 'react';

import Header from '../../../../components/Header';
import { useMethod } from '../../../../contexts/ServerContext';
import { useSetting } from '../../../../contexts/SettingsContext';
import { useTranslation } from '../../../../contexts/TranslationContext';

const Favorite = ({ room: { _id, f: favorited = false, t: type } }) => {
	const t = useTranslation();
	const isFavoritesEnabled = useSetting('Favorite_Rooms') && ['c', 'p', 'd', 't'].includes(type);
	const toggleFavorite = useMethod('toggleFavorite');
	const handleFavoriteClick = useMutableCallback(() => {
		if (!isFavoritesEnabled) {
			return;
		}
		toggleFavorite(_id, !favorited);
	});
	const favoriteLabel = favorited ? t('Unfavorite') : t('Favorite');
	return (
		isFavoritesEnabled && (
			<Header.State
				title={favoriteLabel}
				icon={favorited ? 'star-filled' : 'star'}
				onClick={handleFavoriteClick}
				color={favorited ? colors.y500 : null}
				tiny
				ghost
			/>
		)
	);
};

export default memo(Favorite);
