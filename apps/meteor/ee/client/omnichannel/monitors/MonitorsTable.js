import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import FilterByText from '../../../../client/components/FilterByText';
import GenericTable from '../../../../client/components/GenericTable';
import { useResizeInlineBreakpoint } from '../../../../client/hooks/useResizeInlineBreakpoint';
import MonitorsRow from './MonitorsRow';

function MonitorsTable({ monitors, totalMonitors, params, sort, onHeaderClick, onChangeParams, onDelete }) {
	const t = useTranslation();

	const [ref, onMediumBreakpoint] = useResizeInlineBreakpoint([600], 200);

	return (
		<GenericTable
			ref={ref}
			header={
				<>
					<GenericTable.HeaderCell key={'name'} sort='name' active={sort[0] === 'name'} direction={sort[1]} onClick={onHeaderClick}>
						{t('Name')}
					</GenericTable.HeaderCell>
					<GenericTable.HeaderCell>{t('Username')}</GenericTable.HeaderCell>
					<GenericTable.HeaderCell>{t('Email')}</GenericTable.HeaderCell>
					<GenericTable.HeaderCell width='x60'>{t('Remove')}</GenericTable.HeaderCell>
				</>
			}
			results={monitors}
			total={totalMonitors}
			params={params}
			setParams={onChangeParams}
			renderFilter={({ onChange, ...props }) => <FilterByText onChange={onChange} {...props} />}
		>
			{(props) => <MonitorsRow key={props._id} medium={onMediumBreakpoint} onDelete={onDelete} {...props} />}
		</GenericTable>
	);
}

export default MonitorsTable;
