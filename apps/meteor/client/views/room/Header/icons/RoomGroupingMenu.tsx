import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoomCategoryItems } from '../../../../sidebar/categories/useRoomCategoryItems';
import { useCustomCategories } from '../../../../sidebar/hooks/useCustomCategories';
import { useUserIsSubscribed } from '../../contexts/RoomContext';

const getGroupingIcon = (favorite: boolean, category: boolean): 'star-filled' | 'folder' | 'star' => {
	if (favorite) {
		return 'star-filled';
	}

	if (category) {
		return 'folder';
	}

	return 'star';
};

const RoomGroupingMenu = ({ room }: { room: IRoom & { f?: ISubscription['f'] } }) => {
	const { t } = useTranslation();
	const subscribed = useUserIsSubscribed();
	const isFavoritesEnabled = useSetting('Favorite_Rooms', true) && ['c', 'p', 'd', 't'].includes(room.t);
	const { getRoomCategory } = useCustomCategories();
	const buildCategoryItems = useRoomCategoryItems();

	if (!subscribed || !isFavoritesEnabled) {
		return null;
	}

	const favorite = Boolean(room.f);
	const category = Boolean(getRoomCategory(room._id));
	const groupingIcon = getGroupingIcon(favorite, category);

	const { moveToItems, removeItem } = buildCategoryItems({ rid: room._id, name: room.name || '', isFavorite: favorite });
	const targetItems = moveToItems.filter((item) => item.id !== 'newCategory');
	const newCategoryItem = moveToItems.find((item) => item.id === 'newCategory');

	const utilItems = [...(newCategoryItem ? [newCategoryItem] : []), ...(removeItem ? [removeItem] : [])];

	const sections = [{ items: targetItems }, ...(utilItems.length ? [{ items: utilItems }] : [])];

	return <GenericMenu title={t('Move_to')} icon={groupingIcon} sections={sections} />;
};

export default memo(RoomGroupingMenu);
