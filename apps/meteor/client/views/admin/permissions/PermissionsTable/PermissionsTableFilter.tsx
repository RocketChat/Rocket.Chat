import { useStableCallback, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ChangeEvent } from 'react';
import { useState, useEffect } from 'react';

import FilterByText from '../../../../components/FilterByText';

const PermissionsTableFilter = ({ onChange }: { onChange: (debouncedFilter: string) => void }) => {
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 500);

	useEffect(() => {
		onChange(debouncedFilter);
	}, [debouncedFilter, onChange]);

	const handleFilter = useStableCallback(({ currentTarget: { value } }: ChangeEvent<HTMLInputElement>) => {
		setFilter(value);
	});

	return <FilterByText value={filter} onChange={handleFilter} />;
};

export default PermissionsTableFilter;
