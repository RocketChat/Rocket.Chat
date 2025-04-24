import { CheckOption, Option, PaginatedMultiSelectFiltered } from '@rocket.chat/fuselage';
import type { PaginatedMultiSelectOption } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps, ReactElement } from 'react';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useInfiniteDepartmentsList } from './Omnichannel/hooks/useInfiniteDepartmentsList';

type AutoCompleteDepartmentMultipleProps = {
	value?: PaginatedMultiSelectOption[];
	onChange: (value: PaginatedMultiSelectOption[]) => void;
	onlyMyDepartments?: boolean;
	showArchived?: boolean;
	enabled?: boolean;
	withCheckbox?: boolean;
	excludeId?: string;
} & Omit<ComponentProps<typeof PaginatedMultiSelectFiltered>, 'options'>;

const AutoCompleteDepartmentMultiple = ({
	value = [],
	onlyMyDepartments = false,
	showArchived = false,
	enabled = false,
	withCheckbox = true,
	excludeId,
	onChange = () => undefined,
}: AutoCompleteDepartmentMultipleProps) => {
	const { t } = useTranslation();
	const [departmentsFilter, setDepartmentsFilter] = useState('');

	const debouncedDepartmentsFilter = useDebouncedValue(departmentsFilter, 500);

	const { data: departmentsItems = [], fetchNextPage } = useInfiniteDepartmentsList({
		filter: debouncedDepartmentsFilter,
		excludeId,
		onlyMyDepartments,
		showArchived,
		enabled,
	});

	const departmentOptions = useMemo(() => {
		const pending = value.filter(({ value }) => !departmentsItems.find((dep) => dep.value === value)) || [];
		return [...departmentsItems, ...pending];
	}, [departmentsItems, value]);

	const renderItem = ({ label, ...props }: ComponentProps<typeof Option>): ReactElement => {
		if (withCheckbox) {
			<CheckOption
				{...props}
				label={<span style={{ whiteSpace: 'normal' }}>{label}</span>}
				selected={value.some((item) => item.value === props.value)}
			/>;
		}

		return <Option {...props} label={label} />;
	};

	return (
		<PaginatedMultiSelectFiltered
			withTitle
			value={value}
			onChange={onChange}
			filter={departmentsFilter}
			setFilter={setDepartmentsFilter}
			options={departmentOptions}
			width='100%'
			flexShrink={0}
			flexGrow={0}
			placeholder={t('Select_an_option')}
			renderItem={renderItem}
			endReached={() => fetchNextPage()}
		/>
	);
};

export default memo(AutoCompleteDepartmentMultiple);
