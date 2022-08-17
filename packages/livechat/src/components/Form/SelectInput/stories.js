import { action } from '@storybook/addon-actions';
import { withKnobs, boolean, object, text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { SelectInput } from '.';
import { Form, FormField } from '..';
import { centered } from '../../../helpers.stories';


storiesOf('Forms/SelectInput', module)
	.addDecorator(centered)
	.addDecorator(withKnobs)
	.add('empty', () => (
		<Form>
			<FormField>
				<SelectInput
					value={text('value', '')}
					options={object('options', [
						{ value: '1', label: 'Option 1' },
						{ value: '2', label: 'Option 2' },
						{ value: '3', label: 'Option 3' },
					])}
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
	.add('selected', () => (
		<Form>
			<FormField>
				<SelectInput
					value={text('value', '2')}
					options={object('options', [
						{ value: '1', label: 'Option 1' },
						{ value: '2', label: 'Option 2' },
						{ value: '3', label: 'Option 3' },
					])}
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
				<SelectInput
					value={text('value', '2')}
					options={object('options', [
						{ value: '1', label: 'Option 1' },
						{ value: '2', label: 'Option 2' },
						{ value: '3', label: 'Option 3' },
					])}
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
				<SelectInput
					value={text('value', '2')}
					options={object('options', [
						{ value: '1', label: 'Option 1' },
						{ value: '2', label: 'Option 2' },
						{ value: '3', label: 'Option 3' },
					])}
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
				<SelectInput
					value={text('value', '2')}
					options={object('options', [
						{ value: '1', label: 'Option 1' },
						{ value: '2', label: 'Option 2' },
						{ value: '3', label: 'Option 3' },
					])}
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
