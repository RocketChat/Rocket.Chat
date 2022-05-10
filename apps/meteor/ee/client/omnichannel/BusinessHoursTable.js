import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import FilterByText from '../../../client/components/FilterByText';
import GenericTable from '../../../client/components/GenericTable';
import { useResizeInlineBreakpoint } from '../../../client/hooks/useResizeInlineBreakpoint';
import BusinessHoursRow from './BusinessHoursRow';

function BusinessHoursTable({ businessHours, totalbusinessHours, params, onChangeParams, reload }) {
	const t = useTranslation();

	const [ref, onMediumBreakpoint] = useResizeInlineBreakpoint([600], 200);

	return (
		<GenericTable
			ref={ref}
			header={
				<>
					<GenericTable.HeaderCell>{t('Name')}</GenericTable.HeaderCell>
					<GenericTable.HeaderCell>{t('Timezone')}</GenericTable.HeaderCell>
					<GenericTable.HeaderCell>{t('Open_Days')}</GenericTable.HeaderCell>
					<GenericTable.HeaderCell width='x100'>{t('Enabled')}</GenericTable.HeaderCell>
					<GenericTable.HeaderCell width='x100'>{t('Remove')}</GenericTable.HeaderCell>
				</>
			}
			results={businessHours}
			total={totalbusinessHours}
			params={params}
			setParams={onChangeParams}
			renderFilter={({ onChange, ...props }) => <FilterByText onChange={onChange} {...props} />}
		>
			{(props) => <BusinessHoursRow key={props._id} medium={onMediumBreakpoint} reload={reload} {...props} />}
		</GenericTable>
	);
}

export default BusinessHoursTable;
