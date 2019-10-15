import React from 'react';

import { useTranslation } from '../../../hooks/useTranslation';
import { InformationList } from './InformationList';
import { InformationEntry } from './InformationEntry';

export function CommitSection({ info }) {
	const t = useTranslation();
	const { commit = {} } = info;

	return <>
		<h3>{t('Commit')}</h3>
		<InformationList>
			<InformationEntry label={t('Hash')}>{commit.hash}</InformationEntry>
			<InformationEntry label={t('Date')}>{commit.date}</InformationEntry>
			<InformationEntry label={t('Branch')}>{commit.branch}</InformationEntry>
			<InformationEntry label={t('Tag')}>{commit.tag}</InformationEntry>
			<InformationEntry label={t('Author')}>{commit.author}</InformationEntry>
			<InformationEntry label={t('Subject')}>{commit.subject}</InformationEntry>
		</InformationList>
	</>;
}
