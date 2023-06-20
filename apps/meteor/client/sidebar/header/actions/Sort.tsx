import { useTranslation } from '@rocket.chat/ui-contexts';
import type { VFC, HTMLAttributes } from 'react';
import React from 'react';

import GenericMenu from '../../../components/GenericMenu';
import { useSortMenu } from './hooks/useSortMenu';

const Sort: VFC<Omit<HTMLAttributes<HTMLElement>, 'is'>> = () => {
	const t = useTranslation();

	const sections = useSortMenu();

	return <GenericMenu icon='sort' sections={sections} title={t('Create_new')} selectionMode='multiple' />;
};

export default Sort;
