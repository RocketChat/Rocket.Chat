import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { IconButton } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { useCategoryMenuItems } from '../../../../sidebar/categories/hooks/useCategoryMenuItems';
import { useRoomFeatures } from '../../contexts/RoomFeaturesContext';

const getGroupingIcon = (favorite: boolean, category: boolean, isFavoritesEnabled: boolean) => {
	if (favorite) {
		return 'star-filled';
	}

	if (category) {
		return 'folder';
	}

	return isFavoritesEnabled ? 'folder-star' : 'folder';
};

type RoomHeaderCategoryMenuProps = {
	room: IRoom & { f?: ISubscription['f']; category?: ISubscription['category'] };
};

const RoomHeaderCategoryMenu = ({ room }: RoomHeaderCategoryMenuProps) => {
	const { t } = useTranslation();
	const { favoritesEnabled: isFavoritesEnabled } = useRoomFeatures();
	const favorite = Boolean(room.f);
	const category = Boolean(room.category);
	const groupingIcon = getGroupingIcon(favorite, category, isFavoritesEnabled);

	const { targetItems, utilItems } = useCategoryMenuItems({
		rid: room._id,
		name: room.name,
		isFavorite: favorite,
		categoryId: room.category,
	});

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
