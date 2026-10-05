import { CheckBox, Item, ItemActions, ItemContent, ItemTitle, PaginatedMultiSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useMonitorsList } from '../hooks/useMonitorsList';

export type AutoCompleteMonitorsProps = Omit<
	ComponentProps<typeof PaginatedMultiSelectFiltered>,
	'options' | 'setFilter' | 'endReached' | 'filter' | 'renderItem'
>;

const AutoCompleteMonitors = ({ value = [], onBlur, onChange, ...props }: AutoCompleteMonitorsProps) => {
	const { t } = useTranslation();
	const [monitorsFilter, setMonitorsFilter] = useState('');
	const debouncedMonitorsFilter = useDebouncedValue(monitorsFilter, 500);

	const { data: monitorsOptions, fetchNextPage } = useMonitorsList({ filter: debouncedMonitorsFilter });
	const selectedValues = useMemo(() => new Set(value.map((item) => item.value)), [value]);

	return (
		<PaginatedMultiSelectFiltered
			withTitle
			{...props}
			value={value}
			filter={monitorsFilter}
			setFilter={setMonitorsFilter}
			options={monitorsOptions}
			placeholder={t('Select_an_option')}
			endReached={() => fetchNextPage()}
			onBlur={onBlur}
			onChange={onChange}
			renderItem={({ label, value, index: _index, selected: _selected, focus, ...props }) => {
				const isSelected = !!value && selectedValues.has(value);

				return (
					<Item {...props} inset='md' selected={isSelected} focused={focus} aria-selected={isSelected}>
						<ItemContent>
							<ItemTitle>{label}</ItemTitle>
						</ItemContent>
						<ItemActions aria-hidden>
							<CheckBox checked={isSelected} readOnly tabIndex={-1} />
						</ItemActions>
					</Item>
				);
			}}
		/>
	);
};

export default memo(AutoCompleteMonitors);
