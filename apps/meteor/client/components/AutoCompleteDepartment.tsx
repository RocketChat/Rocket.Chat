import { ILivechatDepartment } from '@rocket.chat/core-typings';
import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, memo, useMemo, useState } from 'react';

import { useRecordList } from '../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../hooks/useAsyncState';
import { useDepartmentsList } from './Omnichannel/hooks/useDepartmentsList';

type AutoCompleteDepartmentProps = {
	value?: string;
	excludeDepartmentId?: string;
	onlyMyDepartments?: boolean;
	onChange: (value: string) => void;
	haveAll?: boolean;
	haveNone?: boolean;
};

const AutoCompleteDepartment: FC<AutoCompleteDepartmentProps> = (props) => {
	const {
		value,
		excludeDepartmentId,
		onlyMyDepartments = false,
		onChange = (): void => undefined,
		haveAll = false,
		haveNone = false,
	} = props;

	const t = useTranslation();
	const [departmentsFilter, setDepartmentsFilter] = useState<string | number | undefined>('');

	const debouncedDepartmentsFilter = useDebouncedValue(departmentsFilter as string, 500);

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

	const sortedByName = departmentsItems
		.sort((a, b) => {
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
		})

		.map((department): ILivechatDepartment & { label: string; value: string } => ({
			...department,
			label: department?.name || '',
			value: department?._id || '',
		}));

	const findValue = value !== undefined && value !== null ? value : '';
	const department = sortedByName.find((dep) => dep._id === findValue)?.value;

	return (
		<PaginatedSelectFiltered
			withTitle
			value={department}
			onChange={onChange}
			filter={departmentsFilter as string | undefined}
			setFilter={setDepartmentsFilter}
			options={sortedByName}
			placeholder={t('Select_an_option')}
			endReached={
				departmentsPhase === AsyncStatePhase.LOADING
					? (): void => undefined
					: (start): void => loadMoreDepartments(start, Math.min(50, departmentsTotal))
			}
		/>
	);
};

export default memo(AutoCompleteDepartment);
