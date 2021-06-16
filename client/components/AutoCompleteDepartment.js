import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import React, { memo, useMemo, useState } from 'react';

import { useTranslation } from '../contexts/TranslationContext';
import { useEndpointData } from '../hooks/useEndpointData';

const AutoCompleteDepartment = (props) => {
	const { label, onlyMyDepartments = false } = props;

	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const { value: data } = useEndpointData(
		'livechat/department',
		useMemo(() => ({ text: filter, onlyMyDepartments }), [filter, onlyMyDepartments]),
	);

	const options = useMemo(
		() =>
			(data && [
				{ value: 'all', label: label && t('All') },
				...data.departments.map((department) => ({
					value: department._id,
					label: department.name,
				})),
			]) || [{ value: 'all', label: label || t('All') }],
		[data, label, t],
	);

	return (
		<PaginatedSelectFiltered
			filter={filter}
			setFilter={setFilter}
			options={options}
			placeholder={t('Select_an_option')}
		/>
	);

	// return (
	// 	<AutoComplete
	// 		{...props}
	// 		filter={filter}
	// 		setFilter={setFilter}
	// 		renderSelected={({ label }) => <>{label}</>}
	// 		renderItem={({ label, value, ...props }) => (
	// 			<Option title={label} label={label} key={value} {...props} />
	// 		)}
	// 		options={options}
	// 	/>
	// );
};

export default memo(AutoCompleteDepartment);
