import { css } from '@rocket.chat/css-in-js';
import { Box, CheckBox, Item, ItemActions, ItemContent, ItemTitle, PaginatedMultiSelectFiltered } from '@rocket.chat/fuselage';
import type { PaginatedMultiSelectOption } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useDepartmentsList } from '../hooks/useDepartmentsList';

const wrappedTitle = css`
	white-space: normal;
`;

export type AutoCompleteDepartmentMultipleProps = Omit<
	ComponentProps<typeof PaginatedMultiSelectFiltered>,
	'options' | 'renderItem' | 'setFilter' | 'filter' | 'placeholder' | 'endReached'
> & {
	value?: PaginatedMultiSelectOption[];
	onChange: (value: PaginatedMultiSelectOption[]) => void;
	onlyMyDepartments?: boolean;
	showArchived?: boolean;
	enabled?: boolean;
	withCheckbox?: boolean;
	excludeId?: string;
	unitId?: string;
};

const AutoCompleteDepartmentMultiple = ({
	value = [],
	onlyMyDepartments = false,
	showArchived = false,
	enabled = false,
	withCheckbox = false,
	excludeId,
	unitId,
	onChange = () => undefined,
	...props
}: AutoCompleteDepartmentMultipleProps) => {
	const { t } = useTranslation();
	const [departmentsFilter, setDepartmentsFilter] = useState('');

	const debouncedDepartmentsFilter = useDebouncedValue(departmentsFilter, 500);

	const { data: departmentsItems, fetchNextPage } = useDepartmentsList({
		filter: debouncedDepartmentsFilter,
		excludeId,
		onlyMyDepartments,
		showArchived,
		enabled,
		unitId,
	});

	const selectedValues = useMemo(() => new Set(value.map((item) => item.value)), [value]);

	const departmentOptions = useMemo(() => {
		const pending = value.filter(({ value }) => !departmentsItems.find((dep) => dep.value === value)) || [];
		return [...departmentsItems, ...pending];
	}, [departmentsItems, value]);

	return (
		<PaginatedMultiSelectFiltered
			withTitle
			{...props}
			value={value}
			onChange={onChange}
			filter={departmentsFilter}
			setFilter={setDepartmentsFilter}
			options={departmentOptions}
			width='100%'
			flexShrink={0}
			flexGrow={0}
			placeholder={t('Select_an_option')}
			renderItem={({ label, value, index: _index, selected, focus, ...props }) => {
				const isSelected = withCheckbox ? !!value && selectedValues.has(value) : selected;

				return (
					<Item {...props} inset='md' selected={isSelected} focused={focus} aria-selected={isSelected}>
						<ItemContent>
							<Box is={ItemTitle} className={wrappedTitle}>
								{label}
							</Box>
						</ItemContent>
						{withCheckbox && (
							<ItemActions aria-hidden>
								<CheckBox checked={isSelected} readOnly tabIndex={-1} />
							</ItemActions>
						)}
					</Item>
				);
			}}
			endReached={() => fetchNextPage()}
		/>
	);
};

export default memo(AutoCompleteDepartmentMultiple);
