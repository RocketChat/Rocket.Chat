import type { Meta, StoryObj } from '@storybook/react';
import { createRef, useRef, useState } from 'react';
import type { ChangeEvent, FocusEvent, FormEvent, Ref } from 'react';
import { expect, fn, userEvent } from 'storybook/test';

import CheckBox from './CheckBox';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';

// G0 characterization of CheckBox on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/CheckBox',
	component: CheckBox,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof CheckBox>;

type Story = StoryObj<typeof CheckBox>;

const onChange = fn();
const forwardedRef = createRef<HTMLInputElement>();
const handlers = { onFocus: fn(), onBlur: fn(), onClick: fn(), onKeyDown: fn() };

export const Forwarding: Story = {
	render: () => (
		<CheckBox
			ref={forwardedRef}
			className='consumer-class'
			id='check-id'
			title='check title'
			name='check-name'
			value='check-value'
			data-qa='check-qa'
			data-anything='anything'
			aria-label='check label'
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
			'id': 'check-id',
			'title': 'check title',
			'data-qa': 'check-qa',
			'data-anything': 'anything',
			'aria-label': 'check label',
			'ref': forwardedRef,
			handlers,
		});
		await expect(input).toHaveAttribute('name', 'check-name');
		await expect(input).toHaveAttribute('value', 'check-value');
	},
};

export const OnChange: Story = {
	render: () => <CheckBox aria-label='Accept' onChange={onChange} />,
	play: async ({ canvasElement }) => {
		const input = canvasElement.querySelector('input') as HTMLInputElement;
		onChange.mockClear();

		await userEvent.click(input);
		await expect(onChange).toHaveBeenCalledTimes(1);
		await expect(onChange.mock.calls[0][0].target).toBe(input);
		await expect(input).toBeChecked();
	},
};

export const Keyboard: Story = {
	render: () => (
		<>
			<CheckBox aria-label='First' onChange={onChange} />
			<CheckBox aria-label='Second' />
		</>
	),
	play: async ({ canvasElement }) => {
		const [first, second] = [...canvasElement.querySelectorAll('input')];
		const user = userEvent.setup();
		onChange.mockClear();

		await user.tab();
		await expect(first).toHaveFocus();
		await user.keyboard(' ');
		await expect(first).toBeChecked();
		await expect(onChange).toHaveBeenCalledTimes(1);
		await user.keyboard(' ');
		await expect(first).not.toBeChecked();

		await user.tab();
		await expect(second).toHaveFocus();
	},
};

export const Disabled: Story = {
	render: () => <CheckBox aria-label='Off' disabled onChange={onChange} />,
	play: async ({ canvasElement }) => {
		const input = canvasElement.querySelector('input') as HTMLInputElement;
		onChange.mockClear();

		await userEvent.click(input);
		await expect(input).toBeDisabled();
		await expect(input).not.toBeChecked();
		await expect(onChange).not.toHaveBeenCalled();
	},
};

export const Indeterminate: Story = {
	render: () => <CheckBox aria-label='Some' indeterminate onChange={onChange} />,
	play: async ({ canvasElement }) => {
		const input = canvasElement.querySelector('input') as HTMLInputElement;
		await expect(input.indeterminate).toBe(true);

		await userEvent.click(input);
		await expect(input.indeterminate).toBe(true);
	},
};

const IndeterminateToggle = () => {
	const [indeterminate, setIndeterminate] = useState(true);
	return (
		<>
			<CheckBox aria-label='Some' indeterminate={indeterminate} />
			<button type='button' onClick={() => setIndeterminate((value) => !value)}>
				Toggle
			</button>
		</>
	);
};

export const IndeterminateFollowsProp: Story = {
	render: () => <IndeterminateToggle />,
	play: async ({ canvasElement }) => {
		const input = canvasElement.querySelector('input') as HTMLInputElement;
		await expect(input.indeterminate).toBe(true);

		await userEvent.click(canvasElement.querySelector('button') as HTMLButtonElement);
		await expect(input.indeterminate).toBe(false);
	},
};

export const Uncontrolled: Story = {
	render: () => (
		<>
			<CheckBox aria-label='Checked' defaultChecked />
			<CheckBox aria-label='Unchecked' />
		</>
	),
	play: async ({ canvasElement }) => {
		const [checked, unchecked] = [...canvasElement.querySelectorAll('input')];
		await expect(checked).toBeChecked();
		await expect(unchecked).not.toBeChecked();

		await userEvent.click(checked);
		await userEvent.click(unchecked);
		await expect(checked).not.toBeChecked();
		await expect(unchecked).toBeChecked();
	},
};

const Controlled = () => {
	const [value, setValue] = useState(false);
	return <CheckBox aria-label='Controlled' checked={value} onChange={(event) => setValue(event.target.checked)} />;
};

export const ControlledField: Story = {
	render: () => <Controlled />,
	play: async ({ canvasElement }) => {
		const input = canvasElement.querySelector('input') as HTMLInputElement;
		await userEvent.click(input);
		await expect(input).toBeChecked();
		await userEvent.click(input);
		await expect(input).not.toBeChecked();
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
	const input = useRef<HTMLInputElement | null>(null);
	const register = (name: string): Registration => ({
		name,
		ref: (element) => {
			input.current = element;
		},
		onChange: () => undefined,
		onBlur: () => undefined,
	});
	const submit = (event: FormEvent) => {
		event.preventDefault();
		onSubmitted({ terms: input.current?.checked, fromForm: new FormData(event.currentTarget as HTMLFormElement).get('terms') });
	};

	return (
		<form onSubmit={submit}>
			<CheckBox aria-label='Terms' {...register('terms')} />
			<button type='submit'>Send</button>
		</form>
	);
};

export const RegisterSpread: Story = {
	render: () => <RegisteredForm />,
	play: async ({ canvasElement }) => {
		const input = canvasElement.querySelector('input') as HTMLInputElement;
		onSubmitted.mockClear();

		await userEvent.click(input);
		await userEvent.click(canvasElement.querySelector('button') as HTMLButtonElement);
		await expect(onSubmitted).toHaveBeenLastCalledWith({ terms: true, fromForm: 'on' });

		await userEvent.click(input);
		await userEvent.click(canvasElement.querySelector('button') as HTMLButtonElement);
		await expect(onSubmitted).toHaveBeenLastCalledWith({ terms: false, fromForm: null });
	},
};

const fieldChange = fn();

const FieldForm = () => {
	const [value, setValue] = useState(false);
	// What react-hook-form's `useController().field` holds: the value, name, change, blur and a ref
	const field = {
		name: 'terms',
		ref: useRef<HTMLInputElement>(null),
		value,
		onChange: (event: ChangeEvent<HTMLInputElement>) => {
			setValue(event.target.checked);
			fieldChange(event.target.checked);
		},
		onBlur: () => undefined,
	};
	const { value: checked, ...rest } = field;

	return <CheckBox aria-label='Terms' checked={checked} {...rest} />;
};

export const FieldSpread: Story = {
	render: () => <FieldForm />,
	play: async ({ canvasElement }) => {
		const input = canvasElement.querySelector('input') as HTMLInputElement;
		fieldChange.mockClear();

		await userEvent.click(input);
		await expect(fieldChange).toHaveBeenLastCalledWith(true);
		await expect(input).toBeChecked();
		await expect(input).toHaveAttribute('name', 'terms');
	},
};

const everyState = (
	<>
		<CheckBox aria-label='Unchecked' />
		<CheckBox aria-label='Checked' defaultChecked />
		<CheckBox aria-label='Indeterminate' indeterminate />
		<CheckBox aria-label='Disabled' disabled />
		<CheckBox aria-label='Disabled checked' disabled defaultChecked />
		<CheckBox labelChildren='Label' />
	</>
);

export const AriaTree: Story = {
	render: () => everyState,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- checkbox "Unchecked"',
				'- checkbox "Checked" [checked]',
				'- checkbox "Indeterminate"',
				'- checkbox "Disabled" [disabled]',
				'- checkbox "Disabled checked" [checked] [disabled]',
				'- text: "Label"',
				'- checkbox "Label"',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => <CheckBox className='consumer-class' aria-label='Check' />,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > label: rcx-box rcx-box--full rcx-check-box',
				'root > label > input: rcx-box rcx-box--full rcx-check-box__input',
				'root > label > i: rcx-box rcx-box--full rcx-check-box__fake',
			].join('\n'),
		);
	},
};
