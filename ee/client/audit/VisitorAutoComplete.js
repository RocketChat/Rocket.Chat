import React, { useMemo, useState } from 'react';
import { AutoComplete, Option } from '@rocket.chat/fuselage';

import { useEndpointDataExperimental } from '../../../client/hooks/useEndpointDataExperimental';

const query = (term = '') => ({ selector: JSON.stringify({ term }) });

const VisitorAutoComplete = React.memo((props) => {
	const [filter, setFilter] = useState('');
	const { data } = useEndpointDataExperimental('livechat/visitors.autocomplete', useMemo(() => query(filter), [filter]));
	const options = useMemo(() => (data && data.items.map((user) => ({ value: user._id, label: user.name }))) || [], [data]);
	return <AutoComplete
		{...props}
		filter={filter}
		setFilter={setFilter}
		renderSelected={({ label }) => <>{label}</>}
		renderItem={({ value, ...props }) => <Option key={value} {...props} />}
		options={ options }
	/>;
});

export default VisitorAutoComplete;
