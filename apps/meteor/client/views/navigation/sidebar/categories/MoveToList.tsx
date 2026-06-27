import { Option, OptionColumn, OptionDivider, OptionTitle } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoomCategoryItems } from './useRoomCategoryItems';
import type { MovableRoom } from '../../hooks/useCustomCategories';

type MoveToListProps = {
	room: MovableRoom;
	/** Called after a target is chosen (to close the surrounding popover/submenu). */
	onSelect: () => void;
};

/**
 * The shared "Move to" target list: a title, Favorites + custom categories (the current one shown in
 * bold with a check), a divider, then "New category". Rendered identically in the sidebar room kebab
 * submenu and the room-header grouping dropdown.
 */
const MoveToList = ({ room, onSelect }: MoveToListProps) => {
	const { t } = useTranslation();

	const buildCategoryItems = useRoomCategoryItems();
	const { moveToItems, removeItem } = buildCategoryItems(room);
	const newCategoryItem = moveToItems.find((item) => item.id === 'newCategory');
	const targetItems = moveToItems.filter((item) => item.id !== 'newCategory');

	const handleSelect = (item: GenericMenuItemProps) => (event: MouseEvent<HTMLElement>) => {
		if (item.disabled) {
			return;
		}
		item.onClick?.(event);
		onSelect();
	};

	const renderRow = (item: GenericMenuItemProps, selected = false) => (
		<Option
			key={item.id}
			role='menuitem'
			icon={item.icon}
			label={selected ? <strong>{item.content}</strong> : item.content}
			onClick={handleSelect(item)}
		>
			{item.status ? <OptionColumn>{item.status}</OptionColumn> : null}
		</Option>
	);

	return (
		<>
			<OptionTitle>{t('Move_to')}</OptionTitle>
			{targetItems.map((item) => renderRow(item, Boolean(item.status)))}
			{(newCategoryItem || removeItem) && <OptionDivider />}
			{newCategoryItem && renderRow(newCategoryItem)}
			{removeItem && renderRow(removeItem)}
		</>
	);
};

export default MoveToList;
