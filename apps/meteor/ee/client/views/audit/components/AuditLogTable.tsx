import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import GenericTable from '../../../../../client/components/GenericTable';
import type { IAuditLog } from '../../../../definition/IAuditLog';
import AuditLogEntry from './AuditLogEntry';

type AuditLogTableProps = {
	data: IAuditLog[] | undefined;
};

const AuditLogTable = ({ data }: AuditLogTableProps): ReactElement => {
	const t = useTranslation();

	return (
		<GenericTable
			header={
				<>
					<GenericTable.HeaderCell>{t('User')}</GenericTable.HeaderCell>
					<GenericTable.HeaderCell>{t('Looked_for')}</GenericTable.HeaderCell>
					<GenericTable.HeaderCell>{t('When')}</GenericTable.HeaderCell>
					<GenericTable.HeaderCell width={80}>{t('Results')}</GenericTable.HeaderCell>
					<GenericTable.HeaderCell>{t('Filters_applied')}</GenericTable.HeaderCell>
				</>
			}
			results={data}
		>
			{(auditLog) => <AuditLogEntry key={auditLog._id} value={auditLog} />}
		</GenericTable>
	);
};

export default AuditLogTable;
