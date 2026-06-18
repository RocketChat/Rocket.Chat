import { GenericTable, GenericTableHeader, GenericTableHeaderCell, GenericTableBody } from '@rocket.chat/ui-client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { BackgroundJobsTab } from './BackgroundJobsPage';
import BackgroundJobsTableFilters from './BackgroundJobsTableFilters';

type BackgroundJobsTableProps = {
	tab: BackgroundJobsTab;
};

const BackgroundJobsTable = ({ tab: _tab }: BackgroundJobsTableProps) => {
	const { t } = useTranslation();
	const [, setSearchTerm] = useState('');

	return (
		<>
			<BackgroundJobsTableFilters setSearchTerm={setSearchTerm} />
			<GenericTable>
				<GenericTableHeader>
					<GenericTableHeaderCell>{t('Name')}</GenericTableHeaderCell>
					<GenericTableHeaderCell>{t('Status')}</GenericTableHeaderCell>
					<GenericTableHeaderCell>{t('Interval')}</GenericTableHeaderCell>
					<GenericTableHeaderCell>{t('Last Run')}</GenericTableHeaderCell>
					<GenericTableHeaderCell>{t('Next Run')}</GenericTableHeaderCell>
					<GenericTableHeaderCell>{t('Fail Count')}</GenericTableHeaderCell>
					<GenericTableHeaderCell>{t('Actions')}</GenericTableHeaderCell>
				</GenericTableHeader>
				<GenericTableBody></GenericTableBody>
			</GenericTable>
		</>
	);
};

export default BackgroundJobsTable;
