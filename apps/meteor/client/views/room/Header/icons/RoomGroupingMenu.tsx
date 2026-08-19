import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { IconButton } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoomCategoryItems } from '../../../../sidebar/categories/useRoomCategoryItems';
import { useCustomCategories } from '../../../../sidebar/hooks/useCustomCategories';
import { useUserIsSubscribed } from '../../contexts/RoomContext';
import { useToggleFavoriteMutation } from '../../hooks/useToggleFavoriteMutation';

const getGroupingIcon = (favorite: boolean, category: boolean, isFavoritesEnabled: boolean): 'star-filled' | 'folder' | 'star' => {
	if (favorite) {
		return 'star-filled';
	}

	if (category) {
		return 'folder';
	}

	return isFavoritesEnabled ? 'star' : 'folder';
};

const RoomGroupingMenu = ({ room }: { room: IRoom & { f?: ISubscription['f'] } }) => {
	const { t } = useTranslation();
	const subscribed = useUserIsSubscribed();
	const isFavoritesEnabled = useSetting('Favorite_Rooms', true) && ['c', 'p', 'd', 't'].includes(room.t);
	const { hasLicenseModule, getRoomCategory } = useCustomCategories();
	const buildCategoryItems = useRoomCategoryItems();
	const favorite = Boolean(room.f);
	const { mutate: toggleFavorite } = useToggleFavoriteMutation();

	const handleFavoriteClick = useStableCallback(() => {
		if (!isFavoritesEnabled) {
			return;
		}

		toggleFavorite({ roomId: room._id, favorite: !favorite, roomName: room.name || '' });
	});

	if (!subscribed) {
		return null;
	}

	if (!hasLicenseModule || isOmnichannelRoom(room)) {
		if (!isFavoritesEnabled) {
			return null;
		}

		const favoriteLabel = favorite ? `${t('Unfavorite')} ${room.name}` : `${t('Favorite')} ${room.name}`;

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
	}

	const category = Boolean(getRoomCategory(room._id));
	const groupingIcon = getGroupingIcon(favorite, category, isFavoritesEnabled);

	const { moveToItems, removeItem } = buildCategoryItems({ rid: room._id, name: room.name || '', isFavorite: favorite });
	const targetItems = moveToItems.filter((item) => item.id !== 'newCategory');
	const newCategoryItem = moveToItems.find((item) => item.id === 'newCategory');

	const utilItems = [...(newCategoryItem ? [newCategoryItem] : []), ...(removeItem ? [removeItem] : [])];

	const sections = [{ items: targetItems }, ...(utilItems.length ? [{ items: utilItems }] : [])];

	return (
		<GenericMenu
			button={<IconButton small color={favorite ? 'status-font-on-warning' : undefined} icon='menu' marginInlineEnd={4} />}
			title={t('Move_to')}
			icon={groupingIcon}
			sections={sections}
		/>
	);
};

export default memo(RoomGroupingMenu);
