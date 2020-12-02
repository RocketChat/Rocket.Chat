import React, { useMemo, useState } from 'react';
import { AutoComplete, Option } from '@rocket.chat/fuselage';

import { useTranslation } from '../contexts/TranslationContext';
import { useEndpointData } from '../hooks/useEndpointData';

export const AutoCompleteDepartment = React.memo((props) => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const { value: data } = useEndpointData('livechat/department', useMemo(() => ({ text: filter }), [filter]));

	const options = useMemo(() => (data && [{ value: 'all', label: t('All') }, ...data.departments.map((department) => ({ value: department._id, label: department.name }))]) || [{ value: 'all', label: t('All') }], [data, t]);

	return <AutoComplete
		{...props}
		filter={filter}
		setFilter={setFilter}
		renderSelected={({ label }) => <>{label}</>}
		renderItem={({ value, ...props }) => <Option key={value} {...props} />}
		options={ options }
	/>;
});
