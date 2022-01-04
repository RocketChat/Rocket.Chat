import { FieldGroup, Box } from '@rocket.chat/fuselage';
import React from 'react';

import { useForm } from '../../../hooks/useForm';
import TriggersForm from './TriggersForm';

export default {
	title: 'omnichannel/TriggersForm',
	component: TriggersForm,
};

export const Default = () => {
	const { values, handlers } = useForm({
		name: '',
		description: '',
		enabled: true,
		runOnce: false,
		conditions: {
			name: 'page-url',
			value: '',
		},
		actions: {
			name: '',
			params: {
				sender: 'queue',
				msg: '',
				name: '',
			},
		},
	});
	return (
		<Box maxWidth='x600'>
			<FieldGroup>
				<TriggersForm values={values} handlers={handlers} />;
			</FieldGroup>
		</Box>
	);
};
