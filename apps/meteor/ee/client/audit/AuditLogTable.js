import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericTable from '../../../client/components/GenericTable';
import { useFormatDate } from '../../../client/hooks/useFormatDate';
import { useFormatDateAndTime } from '../../../client/hooks/useFormatDateAndTime';
import UserRow from './UserRow';

function AuditLogTable({ data }) {
	const t = useTranslation();

	const formatDateAndTime = useFormatDateAndTime();
	const formatDate = useFormatDate();

	return (
		<GenericTable
			header={
				<>
					<GenericTable.HeaderCell>{t('Username')}</GenericTable.HeaderCell>
					<GenericTable.HeaderCell>{t('Looked_for')}</GenericTable.HeaderCell>
					<GenericTable.HeaderCell>{t('When')}</GenericTable.HeaderCell>
					<GenericTable.HeaderCell w='x80'>{t('Results')}</GenericTable.HeaderCell>
					<GenericTable.HeaderCell>{t('Filters_applied')}</GenericTable.HeaderCell>
				</>
			}
			results={data}
		>
			{(props) => <UserRow key={props._id} formatDateAndTime={formatDateAndTime} formatDate={formatDate} {...props} />}
		</GenericTable>
	);
}

export default AuditLogTable;
