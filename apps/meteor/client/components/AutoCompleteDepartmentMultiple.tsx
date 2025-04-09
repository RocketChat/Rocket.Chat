import { CheckOption, Option, PaginatedMultiSelectFiltered } from '@rocket.chat/fuselage';
import type { PaginatedMultiSelectOption } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps, ReactElement } from 'react';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useRecordList } from '../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../hooks/useAsyncState';
import { useDepartmentsList } from './Omnichannel/hooks/useDepartmentsList';

type AutoCompleteDepartmentMultipleProps = {
	value?: PaginatedMultiSelectOption[];
	onChange: (value: PaginatedMultiSelectOption[]) => void;
	onlyMyDepartments?: boolean;
	showArchived?: boolean;
	enabled?: boolean;
	withCheckbox?: boolean;
} & Omit<ComponentProps<typeof PaginatedMultiSelectFiltered>, 'options'>;

const AutoCompleteDepartmentMultiple = ({
	value = [],
	onlyMyDepartments = false,
	showArchived = false,
	enabled = false,
	withCheckbox = true,
	onChange = () => undefined,
}: AutoCompleteDepartmentMultipleProps) => {
	const { t } = useTranslation();
	const [departmentsFilter, setDepartmentsFilter] = useState('');

	const debouncedDepartmentsFilter = useDebouncedValue(departmentsFilter, 500);

	const { itemsList: departmentsList, loadMoreItems: loadMoreDepartments } = useDepartmentsList(
		useMemo(
			() => ({ filter: debouncedDepartmentsFilter, onlyMyDepartments, ...(showArchived && { showArchived: true }), enabled }),
			[debouncedDepartmentsFilter, enabled, onlyMyDepartments, showArchived],
		),
	);

	const { phase: departmentsPhase, items: departmentsItems, itemCount: departmentsTotal } = useRecordList(departmentsList);

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
			endReached={
				departmentsPhase === AsyncStatePhase.LOADING
					? () => undefined
					: (start?: number) => {
							if (start === undefined) {
								return;
							}
							return loadMoreDepartments(start, Math.min(50, departmentsTotal));
						}
			}
		/>
	);
};

export default memo(AutoCompleteDepartmentMultiple);
