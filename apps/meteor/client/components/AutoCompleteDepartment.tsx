import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { memo, useMemo, useState, ReactElement, forwardRef } from 'react';

import { useTranslation } from '../contexts/TranslationContext';
import { useRecordList } from '../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../hooks/useAsyncState';
import { useDepartmentsList } from './Omnichannel/hooks/useDepartmentsList';

type AutoCompleteDepartmentProps = {
	value: string;
	excludeDepartmentId?: string;
	onlyMyDepartments?: boolean;
	haveAll?: boolean;
	haveNone?: boolean;
	name?: string;
	onBlur?: () => void;
	onChange: () => void;
};

const AutoCompleteDepartment = forwardRef(function AutoCompleteDepartment({
	value,
	excludeDepartmentId,
	onlyMyDepartments = false,
	onChange = (): void => undefined,
	haveAll = false,
	haveNone = false,
	name,
	onBlur,
}: AutoCompleteDepartmentProps): ReactElement {
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
		if (a.value === 'all') {
			return -1;
		}

		if (a.label > b.label) {
			return 1;
		}
		if (a.label < b.label) {
			return -1;
		}

		return 0;
	});

	return (
		<PaginatedSelectFiltered
			withTitle
			value={value}
			onChange={onChange}
			filter={departmentsFilter}
			setFilter={setDepartmentsFilter as (value: string | number | undefined) => void}
			options={sortedByName}
			placeholder={t('Select_an_option')}
			endReached={
				departmentsPhase === AsyncStatePhase.LOADING
					? (): void => undefined
					: (start): void => loadMoreDepartments(start, Math.min(50, departmentsTotal))
			}
			name={name}
			onBlur={onBlur}
		/>
	);
});

export default memo(AutoCompleteDepartment);
