import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { HeaderState } from '@rocket.chat/ui-client';
import { useSetting, useMethod, useTranslation, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import { useUserIsSubscribed } from '../../contexts/RoomContext';

const Favorite = ({ room: { _id, f: favorite = false, t: type, name } }: { room: IRoom & { f?: ISubscription['f'] } }) => {
	const t = useTranslation();
	const subscribed = useUserIsSubscribed();
	const dispatchToastMessage = useToastMessageDispatch();

	const isFavoritesEnabled = useSetting('Favorite_Rooms') && ['c', 'p', 'd', 't'].includes(type);
	const toggleFavorite = useMethod('toggleFavorite');

	const handleFavoriteClick = useEffectEvent(() => {
		if (!isFavoritesEnabled) {
			return;
		}

		try {
			toggleFavorite(_id, !favorite);
			dispatchToastMessage({
				type: 'success',
				message: !favorite
					? t('__roomName__was_added_to_favorites', { roomName: name })
					: t('__roomName__was_removed_from_favorites', { roomName: name }),
			});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
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
			color={favorite ? 'status-font-on-warning' : null}
			tiny
		/>
	);
};

export default memo(Favorite);
