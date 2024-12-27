import { AutoComplete, Option } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps, ReactElement } from 'react';
import { memo, useMemo, useState } from 'react';

type VisitorAutoCompleteProps = Omit<ComponentProps<typeof AutoComplete>, 'filter'>;

const VisitorAutoComplete = ({ value, onChange, ...props }: VisitorAutoCompleteProps): ReactElement => {
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
