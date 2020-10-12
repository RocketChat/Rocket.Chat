import React from 'react';
import { FieldGroup, Box } from '@rocket.chat/fuselage';

import FiltersForm from './FiltersForm';
import { useForm } from '../../hooks/useForm';

export default {
	title: 'omnichannel/FiltersForm',
	component: FiltersForm,
};

export const Default = () => {
	const { values, handlers } = useForm({
		name: '',
		description: '',
		enabled: true,
		regex: '',
		slug: '',
	});
	return <Box maxWidth='x600'>
		<FieldGroup>
			<FiltersForm values={values} handlers={handlers}/>;
		</FieldGroup>
	</Box>;
};
