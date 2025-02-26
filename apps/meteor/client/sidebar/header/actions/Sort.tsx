import { Sidebar } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useSortMenu } from './hooks/useSortMenu';

type SortProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const Sort = (props: SortProps) => {
	const { t } = useTranslation();
	const { sidebar } = useLayout();
	const sections = useSortMenu();

	return (
		<GenericMenu
			icon='sort'
			sections={sections}
			title={t('Display')}
			selectionMode='multiple'
			is={Sidebar.TopBar.Action}
			disabled={sidebar.isCollapsed}
			{...props}
		/>
	);
};

export default Sort;
