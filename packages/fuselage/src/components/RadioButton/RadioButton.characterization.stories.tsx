import type { Meta, StoryObj } from '@storybook/react';
import { createRef, useRef, useState } from 'react';
import type { ChangeEvent, FocusEvent, FormEvent, Ref } from 'react';
import { expect, fn, userEvent } from 'storybook/test';

import RadioButton from './RadioButton';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';

// G0 characterization of RadioButton on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/RadioButton',
	component: RadioButton,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof RadioButton>;

type Story = StoryObj<typeof RadioButton>;

const onChange = fn();
const forwardedRef = createRef<HTMLInputElement>();
const handlers = { onFocus: fn(), onBlur: fn(), onClick: fn(), onKeyDown: fn() };

export const Forwarding: Story = {
	render: () => (
		<RadioButton
			ref={forwardedRef}
			className='consumer-class'
			id='radio-id'
			title='radio title'
			name='radio-name'
			value='radio-value'
			data-qa='radio-qa'
			data-anything='anything'
			aria-label='radio label'
			onChange={onChange}
			onFocus={handlers.onFocus}
			onBlur={handlers.onBlur}
			onClick={handlers.onClick}
			onKeyDown={handlers.onKeyDown}
		/>
	),
	play: async ({ canvasElement }) => {
		const label = canvasElement.querySelector('label') as HTMLElement;
		const input = canvasElement.querySelector('input') as HTMLInputElement;

		await expectForwards(canvasElement, label, { className: 'consumer-class' });
		await expect(input).not.toHaveClass('consumer-class');
		await expect(label).not.toHaveAttribute('id');

		await expectForwards(canvasElement, input, {
			'id': 'radio-id',
			'title': 'radio title',
			'data-qa': 'radio-qa',
			'data-anything': 'anything',
			'aria-label': 'radio label',
			'ref': forwardedRef,
			handlers,
		});
		await expect(input).toHaveAttribute('name', 'radio-name');
		await expect(input).toHaveAttribute('value', 'radio-value');
		await expect(input).toHaveAttribute('type', 'radio');
	},
};

const group = (
	<>
		<RadioButton aria-label='One' name='group' value='one' onChange={onChange} />
		<RadioButton aria-label='Two' name='group' value='two' onChange={onChange} />
		<RadioButton aria-label='Three' name='group' value='three' disabled onChange={onChange} />
	</>
);

export const OnChange: Story = {
	render: () => group,
	play: async ({ canvasElement }) => {
		const [one, two] = [...canvasElement.querySelectorAll('input')];
		onChange.mockClear();

		await userEvent.click(one);
		await expect(onChange).toHaveBeenCalledTimes(1);
		await expect(onChange.mock.calls[0][0].target).toBe(one);
		await expect(one).toBeChecked();

		await userEvent.click(two);
		await expect(two).toBeChecked();
		await expect(one).not.toBeChecked();

		await userEvent.click(two);
		await expect(onChange).toHaveBeenCalledTimes(2);
	},
};

export const Keyboard: Story = {
	render: () => group,
	play: async ({ canvasElement }) => {
		const [one, two, three] = [...canvasElement.querySelectorAll('input')];
		const user = userEvent.setup();
		onChange.mockClear();

		await user.tab();
		await expect(one).toHaveFocus();
		await user.keyboard(' ');
		await expect(one).toBeChecked();

		await user.keyboard('{ArrowDown}');
		await expect(two).toHaveFocus();
		await expect(two).toBeChecked();
		await expect(one).not.toBeChecked();

		await user.keyboard('{ArrowDown}');
		await expect(one).toHaveFocus();
		await expect(three).not.toBeChecked();
	},
};

export const Disabled: Story = {
	render: () => <RadioButton aria-label='Off' disabled onChange={onChange} />,
	play: async ({ canvasElement }) => {
		const input = canvasElement.querySelector('input') as HTMLInputElement;
		onChange.mockClear();

		await userEvent.click(input);
		await expect(input).toBeDisabled();
		await expect(input).not.toBeChecked();
		await expect(onChange).not.toHaveBeenCalled();
	},
};

export const Uncontrolled: Story = {
	render: () => (
		<>
			<RadioButton aria-label='Checked' name='uncontrolled' defaultChecked />
			<RadioButton aria-label='Unchecked' name='uncontrolled' />
		</>
	),
	play: async ({ canvasElement }) => {
		const [checked, unchecked] = [...canvasElement.querySelectorAll('input')];
		await expect(checked).toBeChecked();
		await expect(unchecked).not.toBeChecked();

		await userEvent.click(unchecked);
		await expect(checked).not.toBeChecked();
		await expect(unchecked).toBeChecked();
	},
};

const Controlled = () => {
	const [value, setValue] = useState('one');
	return (
		<>
			{['one', 'two'].map((option) => (
				<RadioButton
					key={option}
					aria-label={option}
					name='controlled'
					value={option}
					checked={value === option}
					onChange={(event) => setValue(event.target.value)}
				/>
			))}
		</>
	);
};

export const ControlledField: Story = {
	render: () => <Controlled />,
	play: async ({ canvasElement }) => {
		const [one, two] = [...canvasElement.querySelectorAll('input')];
		await expect(one).toBeChecked();

		await userEvent.click(two);
		await expect(two).toBeChecked();
		await expect(one).not.toBeChecked();
	},
};

// What react-hook-form's `register(name)` returns, spread on the control: name, a ref that reads the input, change and blur
type Registration = {
	name: string;
	ref: Ref<HTMLInputElement>;
	onChange: (event: ChangeEvent<HTMLInputElement>) => void;
	onBlur: (event: FocusEvent<HTMLInputElement>) => void;
};

const onSubmitted = fn();

const RegisteredForm = () => {
	const inputs = useRef<HTMLInputElement[]>([]);
	const register = (name: string): Registration => ({
		name,
		ref: (element) => {
			if (element && !inputs.current.includes(element)) {
				inputs.current.push(element);
			}
		},
		onChange: () => undefined,
		onBlur: () => undefined,
	});
	const submit = (event: FormEvent) => {
		event.preventDefault();
		onSubmitted({
			fromRefs: inputs.current.find((input) => input.checked)?.value,
			fromForm: new FormData(event.currentTarget as HTMLFormElement).get('choice'),
		});
	};

	return (
		<form onSubmit={submit}>
			<RadioButton aria-label='One' value='one' {...register('choice')} />
			<RadioButton aria-label='Two' value='two' {...register('choice')} />
			<button type='submit'>Send</button>
		</form>
	);
};

export const RegisterSpread: Story = {
	render: () => <RegisteredForm />,
	play: async ({ canvasElement }) => {
		const [, two] = [...canvasElement.querySelectorAll('input')];
		onSubmitted.mockClear();

		await userEvent.click(two);
		await userEvent.click(canvasElement.querySelector('button') as HTMLButtonElement);
		await expect(onSubmitted).toHaveBeenLastCalledWith({ fromRefs: 'two', fromForm: 'two' });
	},
};

const fieldChange = fn();

const FieldForm = () => {
	const [value, setValue] = useState('');
	// What react-hook-form's `useController().field` holds: the value, name, change, blur and a ref
	const field = {
		name: 'choice',
		ref: useRef<HTMLInputElement>(null),
		value,
		onChange: (event: ChangeEvent<HTMLInputElement>) => {
			setValue(event.target.value);
			fieldChange(event.target.value);
		},
		onBlur: () => undefined,
	};
	const { value: selected, ...rest } = field;

	return (
		<>
			<RadioButton aria-label='One' value='one' checked={selected === 'one'} {...rest} />
			<RadioButton aria-label='Two' value='two' checked={selected === 'two'} {...rest} />
		</>
	);
};

export const FieldSpread: Story = {
	render: () => <FieldForm />,
	play: async ({ canvasElement }) => {
		const [, two] = [...canvasElement.querySelectorAll('input')];
		fieldChange.mockClear();

		await userEvent.click(two);
		await expect(fieldChange).toHaveBeenLastCalledWith('two');
		await expect(two).toBeChecked();
		await expect(two).toHaveAttribute('name', 'choice');
	},
};

const everyState = (
	<>
		<RadioButton aria-label='Unchecked' name='tree' />
		<RadioButton aria-label='Checked' name='tree' defaultChecked />
		<RadioButton aria-label='Disabled' name='tree' disabled />
		<RadioButton aria-label='Disabled checked' name='other' disabled defaultChecked />
		<RadioButton labelChildren='Label' name='tree' />
	</>
);

export const AriaTree: Story = {
	render: () => everyState,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- radio "Unchecked"',
				'- radio "Checked" [checked]',
				'- radio "Disabled" [disabled]',
				'- radio "Disabled checked" [checked] [disabled]',
				'- text: "Label"',
				'- radio "Label"',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => <RadioButton className='consumer-class' aria-label='Radio' />,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > label: rcx-box rcx-box--full rcx-radio-button',
				'root > label > input: rcx-box rcx-box--full rcx-radio-button__input',
				'root > label > i: rcx-box rcx-box--full rcx-radio-button__fake',
			].join('\n'),
		);
	},
};
