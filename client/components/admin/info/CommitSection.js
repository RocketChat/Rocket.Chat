import { Subtitle } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { DescriptionList } from './DescriptionList';

export function CommitSection({ info }) {
	const t = useTranslation();
	const { commit = {} } = info;

	return <>
		<Subtitle>{t('Commit')}</Subtitle>
		<DescriptionList>
			<DescriptionList.Entry label={t('Hash')}>{commit.hash}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Date')}>{commit.date}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Branch')}>{commit.branch}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Tag')}>{commit.tag}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Author')}>{commit.author}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Subject')}>{commit.subject}</DescriptionList.Entry>
		</DescriptionList>
	</>;
}
