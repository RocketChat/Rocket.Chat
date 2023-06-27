import { action } from '@storybook/addon-actions';
import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { Form, PasswordInput, SelectInput, TextInput } from '.';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { FormField } from './FormField';

export default {
	title: 'Forms/Form',
	component: Form,
	args: {
		onSubmit: (event: Event) => {
			event.preventDefault();
			action('submit')(event);
		},
	},
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof Form>>;

export const Default: Story<ComponentProps<typeof Form>> = (args) => (
	<Form {...args}>
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
);
Default.storyName = 'default';
