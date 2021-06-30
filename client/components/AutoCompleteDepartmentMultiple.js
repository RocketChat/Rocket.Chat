import { PaginatedMultiSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { memo, useMemo, useState } from 'react';

import { useTranslation } from '../contexts/TranslationContext';
import { useRecordList } from '../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../hooks/useAsyncState';
import { useDepartmentsList } from './Omnichannel/hooks/useDepartmentsList';

const AutoCompleteDepartmentMultiple = (props) => {
	const { value, onlyMyDepartments = false, onChange = () => {} } = props;

	const t = useTranslation();
	const [departmentsFilter, setDepartmentsFilter] = useState('');

	const debouncedDepartmentsFilter = useDebouncedValue(departmentsFilter, 500);

	const { itemsList: departmentsList, loadMoreItems: loadMoreDepartments } = useDepartmentsList(
		useMemo(
			() => ({ filter: debouncedDepartmentsFilter, onlyMyDepartments }),
			[debouncedDepartmentsFilter, onlyMyDepartments],
		),
	);

	const {
		phase: departmentsPhase,
		items: departmentsItems,
		itemCount: departmentsTotal,
	} = useRecordList(departmentsList);

	const sortedByName = departmentsItems.sort((a, b) => {
		if (a.name > b.name) {
			return 1;
		}
		if (a.name < b.name) {
			return -1;
		}

		return 0;
	});

	return (
		<PaginatedMultiSelectFiltered
			withTitle
			value={value}
			onChange={onChange}
			filter={departmentsFilter}
			setFilter={setDepartmentsFilter}
			options={sortedByName}
			width='100%'
			flexShrink={0}
			flexGrow={0}
			placeholder={t('Select_an_option')}
			endReached={
				departmentsPhase === AsyncStatePhase.LOADING
					? () => {}
					: (start) => loadMoreDepartments(start, Math.min(50, departmentsTotal))
			}
		/>
	);
};

export default memo(AutoCompleteDepartmentMultiple);
