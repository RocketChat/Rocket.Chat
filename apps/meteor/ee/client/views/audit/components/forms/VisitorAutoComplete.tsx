import type { ILivechatVisitor } from '@rocket.chat/core-typings';
import { AutoComplete, Option } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps, ReactElement } from 'react';
import React, { memo, useMemo, useState } from 'react';

type VisitorAutoCompleteProps = Omit<
	ComponentProps<typeof AutoComplete>,
	'value' | 'filter' | 'setFilter' | 'renderSelected' | 'renderItem' | 'options' | 'onChange'
> & {
	value: ILivechatVisitor['_id'] | undefined;
	onChange: (value: ILivechatVisitor['_id'] | undefined) => void;
};

const VisitorAutoComplete = ({ value, onChange, ...props }: VisitorAutoCompleteProps): ReactElement => {
	const [filter, setFilter] = useState('');

	const performVisitorSearch = useEndpoint('GET', '/v1/livechat/visitors.autocomplete');

	const visitorAutocompleteQueryResult = useQuery(['audit', 'visitors', filter], () =>
		performVisitorSearch({ selector: JSON.stringify({ term: filter ?? '' }) }),
	);

	const options = useMemo(
		() => visitorAutocompleteQueryResult.data?.items.map((user) => ({ value: user._id, label: user.name ?? user.username })) ?? [],
		[visitorAutocompleteQueryResult.data],
	);

	const handleChange = useMutableCallback((value: unknown, action: 'remove' | undefined) => {
		if (action === 'remove') {
			onChange(undefined);
			return;
		}

		onChange(value as ILivechatVisitor['_id']);
	});

	return (
		<AutoComplete
			{...props}
			value={value as any} // TODO: ????
			onChange={handleChange}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ label }) => <>{label}</>}
			renderItem={({ value, ...props }) => <Option key={value} {...props} />}
			options={options}
		/>
	);
};

export default memo(VisitorAutoComplete);
