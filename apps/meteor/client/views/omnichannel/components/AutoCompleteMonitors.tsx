import { CheckOption, PaginatedMultiSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps, ReactElement } from 'react';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useMonitorsList } from '../hooks/useMonitorsList';

type AutoCompleteMonitorsProps = Omit<
	ComponentProps<typeof PaginatedMultiSelectFiltered>,
	'options' | 'setFilter' | 'endReached' | 'filter' | 'renderItem'
>;

const AutoCompleteMonitors = ({ value = [], onBlur, onChange, ...props }: AutoCompleteMonitorsProps): ReactElement => {
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
			renderItem={({ label, value, ...props }) => (
				<CheckOption {...props} label={label} selected={value ? selectedValues.has(value) : false} />
			)}
		/>
	);
};

export default memo(AutoCompleteMonitors);
