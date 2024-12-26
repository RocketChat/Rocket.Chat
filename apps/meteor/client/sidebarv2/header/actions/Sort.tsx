import { SidebarV2Action } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useSortMenu } from './hooks/useSortMenu';

type SortProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const Sort = (props: SortProps) => {
	const { t } = useTranslation();

	const sections = useSortMenu();

	return <GenericMenu icon='sort' sections={sections} title={t('Display')} selectionMode='multiple' is={SidebarV2Action} {...props} />;
};

export default Sort;
