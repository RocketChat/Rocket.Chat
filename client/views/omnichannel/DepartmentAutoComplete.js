import React, { useMemo, useState } from 'react';
import { AutoComplete, Option, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useEndpointData } from '../../hooks/useEndpointData';

const query = (term = '') => ({ selector: JSON.stringify({ term }) });

const DepartmentAutoComplete = React.memo((props) => {
	const [filter, setFilter] = useState('');
	const { value: data } = useEndpointData('livechat/department.autocomplete', useMemo(() => query(filter), [filter]));
	const options = useMemo(() => (data && data.items.map((department) => ({ value: department._id, label: department.name }))) || [], [data]);
	const onClickRemove = useMutableCallback(() => props.onChange(''));
	return <AutoComplete
		{...props}
		filter={filter}
		setFilter={setFilter}
		renderSelected={({ value, label, ...props }) => <Option key={value} {...props} onClick={onClickRemove}>{label}<Icon name='cross' /></Option>}
		renderItem={({ value, label, ...props }) => <Option key={value} {...props} >{label}</Option>}
		options={ options }
	/>;
});

export default DepartmentAutoComplete;
