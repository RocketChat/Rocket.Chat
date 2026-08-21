import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { IconButton } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useRoomCategoryItems } from '../../../../sidebar/categories/useRoomCategoryItems';

const getGroupingIcon = (favorite: boolean, category: boolean, isFavoritesEnabled: boolean): 'star-filled' | 'folder' | 'star' => {
	if (favorite) {
		return 'star-filled';
	}

	if (category) {
		return 'folder';
	}

	return isFavoritesEnabled ? 'star' : 'folder';
};

type RoomHeaderCategoryMenuProps = {
	room: IRoom & { f?: ISubscription['f']; category?: ISubscription['category'] };
};

const RoomHeaderCategoryMenu = ({ room }: RoomHeaderCategoryMenuProps) => {
	const { t } = useTranslation();
	const isFavoritesEnabled = useSetting('Favorite_Rooms', true);
	const favorite = Boolean(room.f);
	const category = Boolean(room.category);
	const groupingIcon = getGroupingIcon(favorite, category, isFavoritesEnabled);

	const buildCategoryItems = useRoomCategoryItems();

	const { moveToItems, removeItem } = buildCategoryItems({
		rid: room._id,
		name: room.name || '',
		isFavorite: favorite,
		categoryId: room.category,
	});
	const targetItems = moveToItems.filter((item) => item.id !== 'newCategory');
	const newCategoryItem = moveToItems.find((item) => item.id === 'newCategory');

	const utilItems = [...(newCategoryItem ? [newCategoryItem] : []), ...(removeItem ? [removeItem] : [])];

	const sections = [{ items: targetItems }, ...(utilItems.length ? [{ items: utilItems }] : [])];

	return (
		<GenericMenu
			button={<IconButton small color={favorite ? 'status-font-on-warning' : undefined} icon={groupingIcon} marginInlineEnd={4} />}
			title={t('Move_to')}
			icon={groupingIcon}
			sections={sections}
		/>
	);
};

export default RoomHeaderCategoryMenu;
