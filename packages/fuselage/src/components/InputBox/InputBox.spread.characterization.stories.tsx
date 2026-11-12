import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { expect, fireEvent, userEvent, waitFor } from 'storybook/test';

import { Field, FieldLabel, FieldRow } from '../Field';
import { TextAreaInput } from '../TextAreaInput';
import { TextInput } from '../TextInput';

// G0 spread completeness: every key react-hook-form's `register()` and Controller `field` hand an input reaches the DOM
// element, because a part with narrowed props would drop a key it does not name without a type error at the spread.
export default {
	title: 'Characterization/InputBox spread',
	component: TextInput,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof TextInput>;

type Story = StoryObj<typeof TextInput>;

type Values = { plain: string; locked: string; area: string; controlled: string };

function Form() {
	const { register, control, setValue, setFocus, getValues, formState } = useForm<Values>({
		defaultValues: { plain: '', locked: 'locked value', area: '', controlled: 'start' },
		mode: 'onBlur',
	});

	const [read, setRead] = useState('');
	const controlled = useWatch({ control, name: 'controlled' });

	return (
		<form>
			<Field>
				<FieldLabel htmlFor='plain'>Registered</FieldLabel>
				<FieldRow>
					<TextInput id='plain' {...register('plain')} />
				</FieldRow>
			</Field>
			<Field>
				<FieldLabel htmlFor='locked'>Locked</FieldLabel>
				<FieldRow>
					<TextInput id='locked' {...register('locked', { disabled: true })} />
				</FieldRow>
			</Field>
			<Field>
				<FieldLabel htmlFor='area'>Area</FieldLabel>
				<FieldRow>
					<TextAreaInput id='area' {...register('area')} />
				</FieldRow>
			</Field>
			<Field>
				<FieldLabel htmlFor='controlled'>Controlled</FieldLabel>
				<FieldRow>
					<Controller name='controlled' control={control} render={({ field }) => <TextInput id='controlled' {...field} />} />
				</FieldRow>
			</Field>
			<output data-testid='controlled-value'>{controlled}</output>
			<output data-testid='touched'>{Object.keys(formState.touchedFields).join(',')}</output>
			<output data-testid='read'>{read}</output>
			<button type='button' onClick={() => setRead(JSON.stringify(getValues()))}>
				read
			</button>
			<button type='button' onClick={() => setValue('plain', 'set from outside')}>
				set
			</button>
			<button type='button' onClick={() => setFocus('controlled')}>
				focus
			</button>
		</form>
	);
}

export const ReactHookForm: Story = {
	render: () => <Form />,
	play: async ({ canvasElement }) => {
		const user = userEvent.setup();
		const input = (id: string) => canvasElement.querySelector(`#${id}`) as HTMLInputElement;
		const output = (name: string) => canvasElement.querySelector(`[data-testid="${name}"]`) as HTMLElement;

		// name
		await expect(input('plain')).toHaveAttribute('name', 'plain');
		await expect(input('area')).toHaveAttribute('name', 'area');
		await expect(input('controlled')).toHaveAttribute('name', 'controlled');

		// disabled
		await expect(input('locked')).toBeDisabled();
		await expect(input('plain')).toBeEnabled();

		// onChange
		await fireEvent.change(input('plain'), { target: { value: 'abc' } });
		await fireEvent.change(input('area'), { target: { value: 'multi' } });
		await expect(input('area')).toHaveValue('multi');
		await user.click(canvasElement.querySelector('button:nth-of-type(1)') as HTMLElement);
		await waitFor(() => expect(output('read')).toHaveTextContent('"plain":"abc","locked":"locked value","area":"multi"'));

		// onBlur
		await fireEvent.focusOut(input('plain'));
		await waitFor(() => expect(output('touched').textContent).toContain('plain'));

		// ref
		await user.click(canvasElement.querySelector('button:nth-of-type(2)') as HTMLElement);
		await waitFor(() => expect(input('plain')).toHaveValue('set from outside'));
		await user.click(canvasElement.querySelector('button:nth-of-type(3)') as HTMLElement);
		await waitFor(() => expect(input('controlled')).toHaveFocus());

		// value and onChange of a controlled input
		await expect(input('controlled')).toHaveValue('start');
		await fireEvent.change(input('controlled'), { target: { value: 'start!' } });
		await waitFor(() => expect(output('controlled-value')).toHaveTextContent('start!'));
	},
};
