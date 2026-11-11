import { NavBarItem } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useSortMenu } from '../../navbar/NavBarPagesGroup/hooks/useSortMenu';

type SidebarRailSortProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const SidebarRailSort = (props: SidebarRailSortProps) => {
	const { t } = useTranslation();

	const sections = useSortMenu();

	return (
		<GenericMenu
			icon='sort'
			sections={sections}
			title={t('Display')}
			selectionMode='multiple'
			is={NavBarItem}
			placement='right-start'
			{...props}
		/>
	);
};

export default SidebarRailSort;
