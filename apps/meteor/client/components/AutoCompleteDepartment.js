// Cannot convert this file to ts because PaginatedSelectFiltered is not typed yet
// Next release we'll add required types and convert this file, since a new
// fuselage release is OoS of this regression
import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, useMemo, useState } from 'react';

import { useRecordList } from '../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../hooks/useAsyncState';
import { useDepartmentsList } from './Omnichannel/hooks/useDepartmentsList';

const AutoCompleteDepartment = (props) => {
	const { value, excludeDepartmentId, onlyMyDepartments = false, onChange = () => {}, haveAll = false, haveNone = false } = props;

	const t = useTranslation();
	const [departmentsFilter, setDepartmentsFilter] = useState('');

	const debouncedDepartmentsFilter = useDebouncedValue(departmentsFilter, 500);

	const { itemsList: departmentsList, loadMoreItems: loadMoreDepartments } = useDepartmentsList(
		useMemo(
			() => ({
				filter: debouncedDepartmentsFilter,
				onlyMyDepartments,
				haveAll,
				haveNone,
				excludeDepartmentId,
			}),
			[debouncedDepartmentsFilter, onlyMyDepartments, haveAll, haveNone, excludeDepartmentId],
		),
	);

	const { phase: departmentsPhase, items: departmentsItems, itemCount: departmentsTotal } = useRecordList(departmentsList);

	const sortedByName = departmentsItems.sort((a, b) => {
		if (a.value.value === 'all') {
			return -1;
		}

		if (a.name > b.name) {
			return 1;
		}
		if (a.name < b.name) {
			return -1;
		}

		return 0;
	});

	const findValue = value !== undefined && value !== null ? value : '';
	const department = sortedByName.find(
		(dep) => dep._id === (typeof findValue !== 'object' && findValue ? findValue : findValue.value),
	)?.value;

	return (
		<PaginatedSelectFiltered
			withTitle
			value={department}
			onChange={onChange}
			filter={departmentsFilter}
			setFilter={setDepartmentsFilter}
			options={sortedByName}
			placeholder={t('Select_an_option')}
			endReached={
				departmentsPhase === AsyncStatePhase.LOADING ? () => {} : (start) => loadMoreDepartments(start, Math.min(50, departmentsTotal))
			}
		/>
	);
};

export default memo(AutoCompleteDepartment);
