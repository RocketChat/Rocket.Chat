import { Option, PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps, ReactElement } from 'react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useDepartmentsList } from './Omnichannel/hooks/useDepartmentsList';

type AutoCompleteDepartmentProps = {
	value?: string;
	onChange: (value: string) => void;
	excludeId?: string;
	onlyMyDepartments?: boolean;
	haveAll?: boolean;
	haveNone?: boolean;
	showArchived?: boolean;
	unitId?: string;
} & Omit<ComponentProps<typeof PaginatedSelectFiltered>, 'options' | 'setFilter'>;

const AutoCompleteDepartment = ({
	value,
	excludeId,
	onlyMyDepartments,
	unitId,
	onChange,
	haveAll,
	haveNone,
	showArchived = false,
	...props
}: AutoCompleteDepartmentProps): ReactElement | null => {
	const { t } = useTranslation();
	const [departmentsFilter, setDepartmentsFilter] = useState<string>('');

	const debouncedDepartmentsFilter = useDebouncedValue(departmentsFilter, 500);

	const { data: departmentsItems, fetchNextPage } = useDepartmentsList({
		filter: debouncedDepartmentsFilter,
		onlyMyDepartments,
		haveAll,
		haveNone,
		excludeId,
		showArchived,
		selectedDepartmentId: value,
		unitId,
	});

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
			endReached={() => fetchNextPage()}
			renderItem={({ label, ...props }) => <Option {...props} label={<span style={{ whiteSpace: 'normal' }}>{label}</span>} />}
		/>
	);
};

export default memo(AutoCompleteDepartment);
