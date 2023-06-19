import { MenuV2, MenuSection, MenuItem } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { VFC, HTMLAttributes } from 'react';
import React from 'react';

import GenericMenuContent from '../../../components/GenericMenuContent';
import { useGroupingListItems } from './hooks/useGroupingListItems';
import { useSortModeItems } from './hooks/useSortModeItems';
import { useViewModeItems } from './hooks/useViewModeItems';

const Sort: VFC<Omit<HTMLAttributes<HTMLElement>, 'is'>> = () => {
	const t = useTranslation();

	const viewModeItems = useViewModeItems();
	const sortModeItems = useSortModeItems();
	const groupingListItems = useGroupingListItems();

	return (
		<MenuV2 icon='sort' selectionMode='multiple' title={t('Display')}>
			<MenuSection title={t('Display')} items={viewModeItems}>
				{(item) => (
					<MenuItem key={item.id}>
						<GenericMenuContent item={item} />
					</MenuItem>
				)}
			</MenuSection>
			<MenuSection title={t('Sort_By')} items={sortModeItems}>
				{(item) => (
					<MenuItem key={item.id}>
						<GenericMenuContent item={item} />
					</MenuItem>
				)}
			</MenuSection>
			<MenuSection title={t('Group_by')} items={groupingListItems}>
				{(item) => (
					<MenuItem key={item.id}>
						<GenericMenuContent item={item} />
					</MenuItem>
				)}
			</MenuSection>
		</MenuV2>
	);
};

export default Sort;
