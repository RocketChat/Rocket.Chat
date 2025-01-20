import { TextInput } from '@rocket.chat/fuselage';
import { useEffectEvent, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { FormEvent, ReactElement } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const PermissionsTableFilter = ({ onChange }: { onChange: (debouncedFilter: string) => void }): ReactElement => {
	const { t } = useTranslation();
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 500);

	useEffect(() => {
		onChange(debouncedFilter);
	}, [debouncedFilter, onChange]);

	const handleFilter = useEffectEvent(({ currentTarget: { value } }: FormEvent<HTMLInputElement>) => {
		setFilter(value);
	});

	return (
		<TextInput
			data-qa='PermissionTable-PermissionsTableFilter'
			value={filter}
			onChange={handleFilter}
			placeholder={t('Search')}
			flexGrow={0}
		/>
	);
};

export default PermissionsTableFilter;
