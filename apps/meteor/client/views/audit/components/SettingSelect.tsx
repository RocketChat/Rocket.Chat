import { Option, PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useRecordList } from '../../../hooks/lists/useRecordList';
import { useSettingSelectOptions } from '../hooks/useSettingSelectOptions';

export const SettingSelect = ({
	value,
	onChange,
	withTitle,
}: {
	value: string;
	withTitle?: boolean;
	onChange: (value: string) => void;
}) => {
	const { t } = useTranslation();
	const [filter, setFilter] = useState<string>('');

	const debouncedFilter = useDebouncedValue(filter, 500);

	const { itemsList, loadMoreItems } = useSettingSelectOptions(debouncedFilter);

	const { items } = useRecordList(itemsList);

	type PaginatedOptionType = {
		value: string | number;
		label: string;
	};

	return (
		<PaginatedSelectFiltered
			withTitle={withTitle}
			flexShrink={1}
			value={value}
			onChange={onChange}
			placeholder={t('All_settings')}
			filter={filter}
			// TODO: Fix the types on PaginatedSelectFiltered
			setFilter={setFilter as (value: string | number | undefined) => void}
			// TODO: Fix the types on PaginatedSelectFiltered
			options={items as unknown as PaginatedOptionType[]}
			endReached={loadMoreItems}
			renderItem={({ label, ...props }) => (
				<Option {...props} title={t(label)}>
					{label}
				</Option>
			)}
		/>
	);
};
