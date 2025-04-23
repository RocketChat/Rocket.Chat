import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps, ReactElement } from 'react';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useInfiniteDepartmentsList } from './Omnichannel/hooks/useInfiniteDepartmentsList';

type AutoCompleteDepartmentProps = {
	value?: string;
	onChange: (value: string) => void;
	excludeDepartmentId?: string;
	onlyMyDepartments?: boolean;
	haveAll?: boolean;
	haveNone?: boolean;
	showArchived?: boolean;
} & Omit<ComponentProps<typeof PaginatedSelectFiltered>, 'options' | 'setFilter'>;

const AutoCompleteDepartment = ({
	value,
	excludeDepartmentId,
	onlyMyDepartments,
	onChange,
	haveAll,
	haveNone,
	showArchived = false,
	...props
}: AutoCompleteDepartmentProps): ReactElement | null => {
	const { t } = useTranslation();
	const [departmentsFilter, setDepartmentsFilter] = useState<string>('');

	const debouncedDepartmentsFilter = useDebouncedValue(departmentsFilter, 500);

	const {
		data: departmentsItems = [],
		fetchNextPage,
		hasNextPage,
	} = useInfiniteDepartmentsList(
		useMemo(
			() => ({
				filter: debouncedDepartmentsFilter,
				onlyMyDepartments,
				haveAll,
				haveNone,
				excludeDepartmentId,
				showArchived,
				selectedDepartment: value,
			}),
			[debouncedDepartmentsFilter, onlyMyDepartments, haveAll, haveNone, excludeDepartmentId, showArchived, value],
		),
	);

	return (
		<PaginatedSelectFiltered
			withTitle
			{...props}
			value={value}
			onChange={onChange}
			filter={departmentsFilter}
			setFilter={setDepartmentsFilter as (value?: string | number) => void}
			options={departmentsItems}
			placeholder={t('Select_an_option')}
			data-qa='autocomplete-department'
			endReached={hasNextPage ? () => fetchNextPage() : () => undefined}
		/>
	);
};

export default memo(AutoCompleteDepartment);
