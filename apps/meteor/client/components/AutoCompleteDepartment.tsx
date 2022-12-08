import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo, useMemo, useState } from 'react';

import { useRecordList } from '../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../hooks/useAsyncState';
import { useDepartmentsList } from './Omnichannel/hooks/useDepartmentsList';

type AutoCompleteDepartmentProps = {
	value?: { value: string; label: string } | string;
	onChange: (value: string) => void;
	excludeDepartmentId?: string;
	onlyMyDepartments?: boolean;
	haveAll?: boolean;
	haveNone?: boolean;
};

const AutoCompleteDepartment = ({
	value,
	excludeDepartmentId,
	onlyMyDepartments,
	onChange,
	haveAll,
	haveNone,
}: AutoCompleteDepartmentProps): ReactElement | null => {
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

	const sortedByName = useMemo(
		() =>
			departmentsItems.sort((a, b) => {
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
			}),
		[departmentsItems],
	);

	const department = useMemo(() => {
		const valueFound = typeof value === 'string' ? value : value?.value || '';
		return sortedByName.find((dep) => dep.value.value === valueFound)?.value;
	}, [sortedByName, value]);

	return (
		<PaginatedSelectFiltered
			withTitle
			value={department}
			onChange={onChange}
			filter={departmentsFilter}
			// Workaround for setFilter weird typing
			setFilter={setDepartmentsFilter as (value: string | number | undefined) => void}
			// TODO: Fix typing on fuselage
			// Workaround for options wrong typing
			options={sortedByName as any}
			placeholder={t('Select_an_option')}
			data-qa='autocomplete-department'
			endReached={
				departmentsPhase === AsyncStatePhase.LOADING
					? (): void => undefined
					: (start): void => loadMoreDepartments(start, Math.min(50, departmentsTotal))
			}
		/>
	);
};

export default memo(AutoCompleteDepartment);
