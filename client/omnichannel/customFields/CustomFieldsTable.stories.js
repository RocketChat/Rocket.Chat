import React from 'react';

import { CustomFieldsTable } from './CustomFieldsTable';

export default {
	title: 'omnichannel/customFields/CustomFieldsTable',
	component: CustomFieldsTable,
};

const customFields = [
	{
		label: 'CF',
		regexp: '',
		scope: 'visitor',
		visibility: 'visible',
		_id: 'CF',
	}, {
		label: 'CF2',
		regexp: '',
		scope: 'visitor',
		visibility: 'visible',
		_id: 'CF2',
	}, {
		label: 'CF3',
		regexp: '',
		scope: 'visitor',
		visibility: 'visible',
		_id: 'CF3',
	},
];

export const Default = () => <CustomFieldsTable
	customFields={customFields}
	totalCustomFields={customFields.length}
	params={{}}
	sort={[]}
	onSort={() => {}}
	onChangeParams={() => {}}
/>;
