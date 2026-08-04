import type { AutoCompleteProps } from '@rocket.chat/fuselage';
import { AutoComplete, Option } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { memo, useMemo, useState } from 'react';

export type VisitorAutoCompleteProps<TLabel = ReactNode> = Omit<AutoCompleteProps<TLabel>, 'filter'>;

const VisitorAutoComplete = <TLabel = ReactNode,>({ value, onChange, ...props }: VisitorAutoCompleteProps<TLabel>) => {
	const [filter, setFilter] = useState('');

	const performVisitorSearch = useEndpoint('GET', '/v1/livechat/visitors.autocomplete');

	const visitorAutocompleteQueryResult = useQuery({
		queryKey: ['audit', 'visitors', filter],

		queryFn: () => performVisitorSearch({ selector: JSON.stringify({ term: filter ?? '' }) }),
	});

	const options = useMemo(
		() => visitorAutocompleteQueryResult.data?.items.map((user) => ({ value: user._id, label: user.name ?? user.username })) ?? [],
		[visitorAutocompleteQueryResult.data],
	);

	return (
		<AutoComplete
			{...props}
			value={value}
			onChange={onChange}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ selected: { label } }) => <>{label}</>}
			renderItem={({ value, ...props }) => <Option key={value} {...props} />}
			options={options}
		/>
	);
};

export default memo(VisitorAutoComplete);
