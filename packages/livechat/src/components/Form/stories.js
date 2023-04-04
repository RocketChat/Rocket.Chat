import { action } from '@storybook/addon-actions';
import { storiesOf } from '@storybook/react';

import { Form, PasswordInput, SelectInput, TextInput } from '.';
import { centered } from '../../helpers.stories';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { FormField } from './FormField';

function handleSubmit(event, ...args) {
	event.preventDefault();
	action('submit')(event, ...args);
}

storiesOf('Forms/Form', module)
	.addDecorator(centered)
	.add('default', () => (
		<Form onSubmit={handleSubmit}>
			<FormField label='Text' description='Input field for plain text'>
				<TextInput />
			</FormField>
			<FormField label='Password' description='Input field for secret text'>
				<PasswordInput />
			</FormField>
			<FormField label='Select' description='Input field for secret text'>
				<SelectInput
					options={[
						{ value: '1', label: 'Option 1' },
						{ value: '2', label: 'Option 2' },
						{ value: '3', label: 'Option 3' },
					]}
				/>
			</FormField>
			<ButtonGroup>
				<Button submit stack>
					Submit
				</Button>
				<Button nude secondary stack>
					Cancel
				</Button>
			</ButtonGroup>
		</Form>
	));
