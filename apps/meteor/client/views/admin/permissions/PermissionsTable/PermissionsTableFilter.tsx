import { Icon, TextInput } from '@rocket.chat/fuselage';
import { useStableCallback, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ChangeEvent } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 *
 * TODO: Replaced this by FilterByText, it has the same render
 */
const PermissionsTableFilter = ({ onChange }: { onChange: (debouncedFilter: string) => void }) => {
	const { t } = useTranslation();
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 500);

	useEffect(() => {
		onChange(debouncedFilter);
	}, [debouncedFilter, onChange]);

	const handleFilter = useStableCallback(({ currentTarget: { value } }: ChangeEvent<HTMLInputElement>) => {
		setFilter(value);
	});

	return (
		<div>
			<TextInput value={filter} onChange={handleFilter} placeholder={t('Search')} endAddon={<Icon name='magnifier' size='x20' />} />
		</div>
	);
};

export default PermissionsTableFilter;
