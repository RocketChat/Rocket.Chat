import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo, useMemo, useState } from 'react';

import { useRecordList } from '../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../hooks/useAsyncState';
import { useDepartmentsList } from './Omnichannel/hooks/useDepartmentsList';

type AutoCompleteDepartmentProps = {
	value?: string;
	onChange: (value: string) => void;
	excludeDepartmentId?: string;
	onlyMyDepartments?: boolean;
	haveAll?: boolean;
	haveNone?: boolean;
	showArchived?: boolean;
};

const AutoCompleteDepartment = ({
	value,
	excludeDepartmentId,
	onlyMyDepartments,
	onChange,
	haveAll,
	haveNone,
	showArchived = false,
}: AutoCompleteDepartmentProps): ReactElement | null => {
	const t = useTranslation();
	const [departmentsFilter, setDepartmentsFilter] = useState<string>('');

	const debouncedDepartmentsFilter = useDebouncedValue(departmentsFilter, 500);

	const { itemsList: departmentsList, loadMoreItems: loadMoreDepartments } = useDepartmentsList(
		useMemo(
			() => ({
				filter: debouncedDepartmentsFilter,
				onlyMyDepartments,
				haveAll,
				haveNone,
				excludeDepartmentId,
				showArchived,
			}),
			[debouncedDepartmentsFilter, onlyMyDepartments, haveAll, haveNone, excludeDepartmentId, showArchived],
		),
	);

	const { phase: departmentsPhase, items: departmentsItems, itemCount: departmentsTotal } = useRecordList(departmentsList);

	return (
		<PaginatedSelectFiltered
			withTitle
			value={value}
			onChange={onChange}
			filter={departmentsFilter}
			setFilter={setDepartmentsFilter as (value?: string | number) => void}
			options={departmentsItems}
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
