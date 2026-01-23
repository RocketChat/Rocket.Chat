import { Option, PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSettingSelectOptions } from '../hooks/useSettingSelectOptions';

export const SettingSelect = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
	const { t } = useTranslation();
	const [filter, setFilter] = useState<string>('');

	const debouncedFilter = useDebouncedValue(filter, 500);

	const { data, fetchNextPage, isFetchingNextPage } = useSettingSelectOptions(debouncedFilter);
	const flattenedData = data?.pages.flatMap((page) => page) || [];

	return (
		<PaginatedSelectFiltered
			flexShrink={1}
			value={value}
			onChange={(val) => onChange(val)}
			placeholder={t('All_Settings')}
			filter={filter}
			setFilter={setFilter as (value: string | number | undefined) => void}
			options={flattenedData}
			endReached={() => !isFetchingNextPage && fetchNextPage({ cancelRefetch: true })}
			renderItem={({ label, ...props }) => (
				<Option {...props} title={t(label)}>
					{label}
				</Option>
			)}
		/>
	);
};
