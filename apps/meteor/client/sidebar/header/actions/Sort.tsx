import { Sidebar } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { VFC, HTMLAttributes } from 'react';
import React from 'react';

import GenericMenu from '../../../components/GenericMenu/GenericMenu';
import { useSortMenu } from './hooks/useSortMenu';

const Sort: VFC<Omit<HTMLAttributes<HTMLElement>, 'is'>> = (props) => {
	const t = useTranslation();

	const sections = useSortMenu();

	return (
		<GenericMenu icon='sort' sections={sections} title={t('Display')} selectionMode='multiple' is={Sidebar.TopBar.Action} {...props} />
	);
};

export default Sort;
