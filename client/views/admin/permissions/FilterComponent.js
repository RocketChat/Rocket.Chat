import { TextInput } from '@rocket.chat/fuselage';
import { useMutableCallback, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useState, useEffect } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';

const FilterComponent = ({ onChange }) => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');

	const debouncedFilter = useDebouncedValue(filter, 500);

	useEffect(() => {
		onChange(debouncedFilter);
	}, [debouncedFilter, onChange]);

	const handleFilter = useMutableCallback(({ currentTarget: { value } }) => {
		setFilter(value);
	});

	return <TextInput value={filter} onChange={handleFilter} placeholder={t('Search')} flexGrow={0} />;
};

export default FilterComponent;
