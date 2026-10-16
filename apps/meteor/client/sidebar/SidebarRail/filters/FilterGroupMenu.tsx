import type { ISidebarFilter } from '@rocket.chat/core-typings';
import { MAX_FILTER_NAME_LENGTH } from '@rocket.chat/core-typings';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useFilterModals } from './hooks/useFilterModals';
import { useDuplicateFilter } from './hooks/useFilterMutations';
import { useMarkFilterAsRead } from './hooks/useMarkFilterAsRead';

type FilterGroupMenuProps = {
	filter: ISidebarFilter;
	rooms: SubscriptionWithRoom[];
	hasUnread: boolean;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMoveUp: () => void;
	onMoveDown: () => void;
};

const FilterGroupMenu = ({ filter, rooms, hasUnread, canMoveUp, canMoveDown, onMoveUp, onMoveDown }: FilterGroupMenuProps) => {
	const { t } = useTranslation();
	const { openEditFilter, openDeleteFilter } = useFilterModals();
	const { mutate: duplicateFilter } = useDuplicateFilter();
	const { mutate: markAsRead } = useMarkFilterAsRead();

	const items: GenericMenuItemProps[] = [
		{ id: 'edit', icon: 'edit', content: t('Edit'), onClick: () => openEditFilter(filter) },
		{ id: 'move-up', icon: 'arrow-up', content: t('Move_up'), disabled: !canMoveUp, onClick: onMoveUp },
		{ id: 'move-down', icon: 'arrow-down', content: t('Move_down'), disabled: !canMoveDown, onClick: onMoveDown },
		{
			id: 'duplicate',
			icon: 'copy',
			content: t('Duplicate'),
			onClick: () =>
				duplicateFilter({ filterId: filter._id, name: t('Copy_of_name', { name: filter.name }).slice(0, MAX_FILTER_NAME_LENGTH) }),
		},
		{ id: 'mark-read', icon: 'flag', content: t('Mark_as_read'), disabled: !hasUnread, onClick: () => markAsRead(rooms) },
		{ id: 'delete', icon: 'trash', content: t('Delete'), variant: 'danger', onClick: () => openDeleteFilter(filter) },
	];

	return <GenericMenu icon='kebab' title={t('Options')} mini items={items} placement='bottom-end' />;
};

export default memo(FilterGroupMenu);
