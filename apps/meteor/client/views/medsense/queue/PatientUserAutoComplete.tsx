import { AutoComplete, Box, Option } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ComponentProps, ReactElement } from 'react';
import { memo, useEffect, useMemo, useState } from 'react';

export type PatientUserOption = {
	_id: string;
	username: string;
	name?: string;
};

type PatientUserAutoCompleteProps = Omit<ComponentProps<typeof AutoComplete>, 'filter' | 'setFilter' | 'options' | 'onChange' | 'value'> & {
	pharmacyId: string;
	value?: string;
	onChange: (user: PatientUserOption | null) => void;
};

const formatLabel = (user: PatientUserOption): string => {
	const name = user.name?.trim();
	if (name) {
		return `${name} (@${user.username})`;
	}

	return user.username;
};

const PatientUserAutoComplete = ({
	pharmacyId,
	value,
	onChange,
	disabled,
	placeholder,
	...props
}: PatientUserAutoCompleteProps): ReactElement => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const [selectedCache, setSelectedCache] = useState<Record<string, PatientUserOption>>({});
	const filterDebounced = useDebouncedValue(filter, 250);
	const getPatientsByPharmacy = useEndpoint('GET', '/v1/medsense/patients.byPharmacy');
	const normalizedValue = value || undefined;

	const result = useQuery({
		queryKey: ['medsense-patients-by-pharmacy', pharmacyId, filterDebounced],
		queryFn: async () => {
			if (!pharmacyId) {
				return { users: [] as PatientUserOption[], total: 0 };
			}

			return getPatientsByPharmacy({
				pharmacyId,
				text: filterDebounced,
				offset: 0,
				count: 50,
			});
		},
		enabled: Boolean(pharmacyId),
		placeholderData: keepPreviousData,
	});

	useEffect(() => {
		setFilter('');
	}, [pharmacyId]);

	useEffect(() => {
		const users = result.data?.users;
		if (!Array.isArray(users) || !users.length) {
			return;
		}

		setSelectedCache((previousCache) => {
			const nextCache = { ...previousCache };
			for (const user of users) {
				nextCache[user._id] = user;
			}
			return nextCache;
		});
	}, [result.data?.users]);

	const options = useMemo(() => {
		const users = result.data?.users;
		if (!Array.isArray(users)) {
			return [];
		}

		return users.map((user: PatientUserOption) => ({
			value: user._id,
			label: formatLabel(user),
		}));
	}, [result.data?.users]);

	return (
		<AutoComplete
			key={`patient-user-autocomplete-${normalizedValue ?? 'none'}`}
			{...props}
			value={normalizedValue}
			onChange={(rawValue) => {
				if (typeof rawValue !== 'string' || !rawValue.trim()) {
					onChange(null);
					setFilter('');
					return;
				}

				const selectedUser =
					selectedCache[rawValue] || result.data?.users?.find((user: PatientUserOption) => user._id === rawValue) || null;
				onChange(selectedUser);
				setFilter('');
			}}
			filter={filter}
			setFilter={(nextFilter) => {
				const nextFilterText = String(nextFilter ?? '');
				setFilter(nextFilterText);

				if (normalizedValue && nextFilterText.trim().length > 0) {
					onChange(null);
				}
			}}
			options={options}
			placeholder={normalizedValue ? '' : placeholder || t('Select_Patient')}
			disabled={Boolean(disabled) || !pharmacyId}
			renderSelected={({ selected }) => {
				if (!selected?.value) {
					return <Box />;
				}

				const cached = selectedCache[selected.value];
				return <Box>{selected.label || (cached ? formatLabel(cached) : selected.value)}</Box>;
			}}
			renderItem={({ label, ...itemProps }) => <Option {...itemProps} label={label} />}
		/>
	);
};

export default memo(PatientUserAutoComplete);
