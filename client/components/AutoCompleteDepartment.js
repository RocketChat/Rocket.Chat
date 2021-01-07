import React, { useMemo, useState } from 'react';
import { AutoComplete, Option } from '@rocket.chat/fuselage';

import { useEndpointData } from '../hooks/useEndpointData';

export const AutoCompleteDepartment = React.memo((props) => {
	const [filter, setFilter] = useState('');
	const { value: data } = useEndpointData('livechat/department', useMemo(() => ({ text: filter }), [filter]));

	const { label } = props;

	const options = useMemo(() => (data && [{ value: 'All', label: label && label }, ...data.departments.map((department) => ({ value: department._id, label: department.name }))]) || [{ value: 'All', label: label && label }], [data, label]);

	return <AutoComplete
		{...props}
		filter={filter}
		setFilter={setFilter}
		renderSelected={({ label }) => <>{label}</>}
		renderItem={({ value, ...props }) => <Option key={value} {...props} />}
		options={ options }
	/>;
});
