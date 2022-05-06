import { AutoComplete, Option } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { memo, useMemo, useState } from 'react';

import { useEndpointData } from '../../../client/hooks/useEndpointData';

const VisitorAutoComplete = (props) => {
	const [filter, setFilter] = useState('');
	const debouncedVisitorFilter = useDebouncedValue(filter, 500);

	const { value: data } = useEndpointData(
		'livechat/visitors.autocompleteByName',
		useMemo(
			() => ({
				term: debouncedVisitorFilter || '',
			}),
			[debouncedVisitorFilter],
		),
	);
	const options = useMemo(() => (data && data.items.map((user) => ({ value: user._id, label: user.name }))) || [], [data]);
	return (
		<AutoComplete
			{...props}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ label }) => <>{label}</>}
			renderItem={({ value, ...props }) => <Option key={value} {...props} />}
			options={options}
		/>
	);
};

export default memo(VisitorAutoComplete);
