import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import GenericTable from '../../../client/components/GenericTable';
import { useFormatDate } from '../../../client/hooks/useFormatDate';
import { useFormatDateAndTime } from '../../../client/hooks/useFormatDateAndTime';
import type { IAuditLog } from '../../definition/IAuditLog';
import UserRow from './UserRow';

type AuditLogTableProps = {
	data: IAuditLog[] | undefined;
};

const AuditLogTable = ({ data }: AuditLogTableProps): ReactElement => {
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
			{(props) => <UserRow key={props._id} formatDateAndTime={formatDateAndTime} formatDate={formatDate} mediaQuery={false} {...props} />}
		</GenericTable>
	);
};

export default AuditLogTable;
