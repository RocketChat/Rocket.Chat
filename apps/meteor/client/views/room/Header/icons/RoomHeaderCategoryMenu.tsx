import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { Icon, IconButton } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useCategoryMenuItems } from '../../../../sidebar/categories/hooks/useCategoryMenuItems';

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
	const isFavoritesEnabled = useSetting('Favorite_Rooms', true);
	const favorite = Boolean(room.f);
	const category = Boolean(room.category);
	const groupingIconName = getGroupingIcon(favorite, category, isFavoritesEnabled);
	const groupingIcon = favorite ? <Icon name={groupingIconName} size='x20' color='status-font-on-warning' /> : groupingIconName;

	const { targetItems, utilItems } = useCategoryMenuItems({
		rid: room._id,
		name: room.name,
		isFavorite: favorite,
		categoryId: room.category,
	});

	const sections = [{ items: targetItems }, ...(utilItems.length ? [{ items: utilItems }] : [])];

	return (
		<GenericMenu button={<IconButton size='small' icon={groupingIcon} />} title={t('Move_to')} icon={groupingIcon} sections={sections} />
	);
};

export default RoomHeaderCategoryMenu;
