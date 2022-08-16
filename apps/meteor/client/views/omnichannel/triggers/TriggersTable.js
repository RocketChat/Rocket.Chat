import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericTable from '../../../components/GenericTable';
import { useResizeInlineBreakpoint } from '../../../hooks/useResizeInlineBreakpoint';
import TriggersRow from './TriggersRow';

function TriggersTable({ triggers, totalTriggers, params, onChangeParams, onDelete }) {
	const t = useTranslation();

	const [ref, onMediumBreakpoint] = useResizeInlineBreakpoint([600], 200);

	return (
		<GenericTable
			ref={ref}
			header={
				<>
					<GenericTable.HeaderCell>{t('Name')}</GenericTable.HeaderCell>
					<GenericTable.HeaderCell>{t('Description')}</GenericTable.HeaderCell>
					<GenericTable.HeaderCell>{t('Enabled')}</GenericTable.HeaderCell>
					<GenericTable.HeaderCell width='x60'>{t('Remove')}</GenericTable.HeaderCell>
				</>
			}
			results={triggers}
			total={totalTriggers}
			params={params}
			setParams={onChangeParams}
		>
			{(props) => <TriggersRow key={props._id} onDelete={onDelete} medium={onMediumBreakpoint} {...props} />}
		</GenericTable>
	);
}

export default TriggersTable;
