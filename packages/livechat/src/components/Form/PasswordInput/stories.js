import { action } from '@storybook/addon-actions';
import { withKnobs, boolean, text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { PasswordInput } from '.';
import { Form, FormField } from '..';
import { centered } from '../../../helpers.stories';


storiesOf('Forms/PasswordInput', module)
	.addDecorator(centered)
	.addDecorator(withKnobs)
	.add('default', () => (
		<Form>
			<FormField>
				<PasswordInput
					value={text('value', '')}
					placeholder={text('placeholder', 'Placeholder')}
					disabled={boolean('disabled', false)}
					small={boolean('small', false)}
					error={boolean('error', false)}
					onChange={action('change')}
					onInput={action('input')}
				/>
			</FormField>
		</Form>
	))
	.add('filled', () => (
		<Form>
			<FormField>
				<PasswordInput
					value={text('value', 'Value')}
					placeholder={text('placeholder', 'Placeholder')}
					disabled={boolean('disabled', false)}
					small={boolean('small', false)}
					error={boolean('error', false)}
					onChange={action('change')}
					onInput={action('input')}
				/>
			</FormField>
		</Form>
	))
	.add('disabled', () => (
		<Form>
			<FormField>
				<PasswordInput
					value={text('value', 'Value')}
					placeholder={text('placeholder', 'Placeholder')}
					disabled={boolean('disabled', true)}
					small={boolean('small', false)}
					error={boolean('error', false)}
					onChange={action('change')}
					onInput={action('input')}
				/>
			</FormField>
		</Form>
	))
	.add('small', () => (
		<Form>
			<FormField>
				<PasswordInput
					value={text('value', 'Value')}
					placeholder={text('placeholder', 'Placeholder')}
					disabled={boolean('disabled', false)}
					small={boolean('small', true)}
					error={boolean('error', false)}
					onChange={action('change')}
					onInput={action('input')}
				/>
			</FormField>
		</Form>
	))
	.add('with error', () => (
		<Form>
			<FormField>
				<PasswordInput
					value={text('value', 'Value')}
					placeholder={text('placeholder', 'Placeholder')}
					disabled={boolean('disabled', false)}
					small={boolean('small', false)}
					error={boolean('error', true)}
					onChange={action('change')}
					onInput={action('input')}
				/>
			</FormField>
		</Form>
	));
