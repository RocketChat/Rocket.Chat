import { AutoComplete, Item, ItemContent, ItemTitle } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { memo, useMemo, useState } from 'react';

export type VisitorAutoCompleteProps = Omit<ComponentProps<typeof AutoComplete>, 'filter'>;

const VisitorAutoComplete = ({ value, onChange, ...props }: VisitorAutoCompleteProps) => {
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
			renderItem={({ value: _value, label, selected, focus, ...props }) => (
				<Item {...props} is='li' inset='md' selected={selected} focused={focus} aria-selected={selected}>
					<ItemContent>
						<ItemTitle>{label}</ItemTitle>
					</ItemContent>
				</Item>
			)}
			options={options}
		/>
	);
};

export default memo(VisitorAutoComplete);
