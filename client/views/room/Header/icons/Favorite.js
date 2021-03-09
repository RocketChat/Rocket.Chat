import React, { memo } from 'react';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useSetting } from '../../../../contexts/SettingsContext';
import { useMethod } from '../../../../contexts/ServerContext';
import Header from '../../../../components/Header';

const Favorite = ({ room: { _id, f: favorited = false } }) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();
	const isFavoritesEnabled = useSetting('Favorite_Rooms');
	const toggleFavorite = useMethod('toggleFavorite');
	const handleFavoriteClick = useMutableCallback(async () => {
		try {
			if (!isFavoritesEnabled) {
				return;
			}
			await toggleFavorite(_id, !favorited);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});
	const favoriteLabel = favorited ? t('Unfavorite') : t('Favorite');
	return isFavoritesEnabled && <Header.State title={favoriteLabel} icon={favorited ? 'star-filled' : 'star'} onClick={handleFavoriteClick} color={favorited ? colors.y500 : null } tiny ghost/>;
};

export default memo(Favorite);
