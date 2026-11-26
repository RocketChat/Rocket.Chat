import type { Meta, StoryObj } from '@storybook/react';
import { createRef, useState } from 'react';
import { expect, fireEvent, fn, userEvent, waitFor } from 'storybook/test';

import InputBox from './InputBox';
import InputBoxSkeleton from './InputBoxSkeleton';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';
import { EmailInput } from '../EmailInput';
import { NumberInput } from '../NumberInput';
import { PasswordInput } from '../PasswordInput';
import { SearchInput } from '../SearchInput';
import { TextAreaInput } from '../TextAreaInput';
import { TextInput } from '../TextInput';
import { UrlInput } from '../UrlInput';

// G0 characterization of InputBox and the inputs built on it, on their develop implementation. A rewrite passes these
// unedited, in jest and in the compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/InputBox',
	component: InputBox,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof InputBox>;

type Story = StoryObj<typeof InputBox>;

const handlers = {
	onInput: fn(),
	onBlur: fn(),
	onFocus: fn(),
	onKeyDown: fn(),
	onKeyUp: fn(),
	onPaste: fn(),
	onClick: fn(),
	onCompositionStart: fn(),
	onCompositionUpdate: fn(),
	onCompositionEnd: fn(),
};

const onSelect = fn();
const inputRef = createRef<HTMLInputElement>();

const nativeAttributes = {
	name: 'field-name',
	placeholder: 'Type here',
	autoComplete: 'off',
	readOnly: true,
	required: true,
	minLength: 2,
	maxLength: 20,
	pattern: '[a-z]+',
	inputMode: 'text',
	spellCheck: false,
	list: 'some-list',
	form: 'some-form',
	tabIndex: -1,
} as const;

const expectNativeAttributes = async (control: HTMLElement) => {
	await expect(control).toHaveAttribute('name', 'field-name');
	await expect(control).toHaveAttribute('placeholder', 'Type here');
	await expect(control).toHaveAttribute('autocomplete', 'off');
	await expect(control).toHaveAttribute('readonly');
	await expect(control).toBeRequired();
	await expect(control).toHaveAttribute('minlength', '2');
	await expect(control).toHaveAttribute('maxlength', '20');
	await expect(control).toHaveAttribute('inputmode', 'text');
	await expect(control).toHaveAttribute('spellcheck', 'false');
	await expect(control).toHaveAttribute('form', 'some-form');
	await expect(control).toHaveAttribute('tabindex', '-1');
};

export const Forwarding: Story = {
	render: () => (
		<TextInput
			{...{ ref: inputRef }}
			{...nativeAttributes}
			className='consumer-class'
			id='input-id'
			title='input title'
			data-qa='input-qa'
			data-anything='anything'
			aria-label='input label'
			aria-describedby='described-by'
			aria-invalid='false'
			defaultValue='initial'
			{...handlers}
		/>
	),
	play: async ({ canvasElement }) => {
		const input = canvasElement.querySelector('input') as HTMLInputElement;
		await expectForwards(canvasElement, input, {
			'className': 'consumer-class',
			'id': 'input-id',
			'title': 'input title',
			'data-qa': 'input-qa',
			'data-anything': 'anything',
			'aria-label': 'input label',
			'ref': inputRef,
			handlers,
		});
		await expectNativeAttributes(input);
		await expect(input).toHaveAttribute('aria-describedby', 'described-by');
		await expect(input).toHaveAttribute('aria-invalid', 'false');
		await expect(input).toHaveValue('initial');
		await expect(input).toHaveAttribute('type', 'text');
		await expect(input).toHaveAttribute('size', '1');
	},
};

const areaRef = createRef<HTMLTextAreaElement>();
const dragHandlers = { onDragEnter: fn(), onDragLeave: fn(), onDragOver: fn(), onDrop: fn(), ...handlers };

export const ForwardingTextArea: Story = {
	render: () => (
		<TextAreaInput
			{...{ ref: areaRef }}
			{...nativeAttributes}
			className='consumer-class'
			id='area-id'
			title='area title'
			data-qa='area-qa'
			data-anything='anything'
			aria-label='area label'
			rows={4}
			defaultValue='initial'
			{...dragHandlers}
		/>
	),
	play: async ({ canvasElement }) => {
		const area = canvasElement.querySelector('textarea') as HTMLTextAreaElement;
		await expectForwards(canvasElement, area, {
			'className': 'consumer-class',
			'id': 'area-id',
			'title': 'area title',
			'data-qa': 'area-qa',
			'data-anything': 'anything',
			'aria-label': 'area label',
			'ref': areaRef,
			'handlers': dragHandlers,
		});
		await expectNativeAttributes(area);
		await expect(area).toHaveValue('initial');
		await expect(area).toHaveAttribute('rows', '4');
		await expect(area).toHaveAttribute('cols', '1');
		await expect(area).not.toHaveAttribute('type');
		await expect(area).toHaveAttribute('size', '1');
	},
};

export const NumberAttributes: Story = {
	render: () => <NumberInput aria-label='Amount' min={1} max={10} step={2} defaultValue={3} />,
	play: async ({ canvasElement }) => {
		const input = canvasElement.querySelector('input') as HTMLInputElement;
		await expect(input).toHaveAttribute('type', 'number');
		await expect(input).toHaveAttribute('min', '1');
		await expect(input).toHaveAttribute('max', '10');
		await expect(input).toHaveAttribute('step', '2');
		await expect(input).toHaveValue(3);
	},
};

export const FileAttributes: Story = {
	render: () => <InputBox type='file' aria-label='Upload' accept='image/*' multiple />,
	play: async ({ canvasElement }) => {
		const input = canvasElement.querySelector('input') as HTMLInputElement;
		await expect(input).toHaveAttribute('type', 'file');
		await expect(input).toHaveAttribute('accept', 'image/*');
		await expect(input).toHaveAttribute('multiple');
	},
};

export const SelectHandler: Story = {
	render: () => <TextInput aria-label='Selectable' defaultValue='abc' onSelect={onSelect} />,
	play: async ({ canvasElement }) => {
		const user = userEvent.setup();
		const input = canvasElement.querySelector('input') as HTMLInputElement;
		await user.type(input, 'def');
		await expect(onSelect).toHaveBeenCalled();
	},
};

export const ChangeHandler: Story = {
	render: () => <ChangeHarness />,
	play: async ({ canvasElement }) => {
		const input = canvasElement.querySelector('input') as HTMLInputElement;
		await fireEvent.change(input, { target: { value: 'abc' } });
		await expect(input).toHaveValue('abc');
		await waitFor(() => expect(canvasElement.querySelector('[data-testid="mirror"]')).toHaveTextContent('abc'), { timeout: 5000 });
	},
};

function ChangeHarness() {
	const [value, setValue] = useState('');

	return (
		<>
			<TextInput aria-label='Mirrored' value={value} onChange={(event) => setValue(event.currentTarget.value)} />
			<output data-testid='mirror'>{value}</output>
		</>
	);
}

export const Types: Story = {
	render: () => (
		<>
			<TextInput aria-label='text' />
			<EmailInput aria-label='email' />
			<PasswordInput aria-label='password' />
			<NumberInput aria-label='number' />
			<SearchInput aria-label='search' />
			<UrlInput aria-label='url' />
			<InputBox type='date' aria-label='date' />
			<InputBox type='time' aria-label='time' />
			<InputBox type='datetime-local' aria-label='datetime' />
			<InputBox type='color' aria-label='color' />
		</>
	),
	play: async ({ canvasElement }) => {
		const types = [...canvasElement.querySelectorAll('input')].map((input) => input.getAttribute('type'));
		await expect(types).toEqual(['text', 'email', 'password', 'number', 'search', 'url', 'date', 'time', 'datetime-local', 'color']);
		await expect(canvasElement.querySelector('textarea')).toBeNull();
	},
};

export const Addons: Story = {
	render: () => (
		<>
			<InputBox type='text' aria-label='start' startAddon={<i data-testid='start' />} className='consumer-wrapper' />
			<InputBox type='text' aria-label='end' endAddon={<i data-testid='end' />} endAddonFlush />
			<InputBox type='text' aria-label='plain' className='consumer-input' />
		</>
	),
	play: async ({ canvasElement }) => {
		const [start, end, plain] = [...canvasElement.querySelectorAll('input')];

		await expect(start.parentElement?.tagName).toBe('LABEL');
		await expect(start.parentElement).toHaveClass('rcx-input-box__wrapper', 'rcx-label', 'consumer-wrapper');
		await expect(start).not.toHaveClass('consumer-wrapper');
		await expect(start).toHaveClass('rcx-input-box--undecorated');
		await expect(start.previousElementSibling).toHaveClass('rcx-input-box__addon');
		await expect(start.previousElementSibling).toContainElement(canvasElement.querySelector('[data-testid="start"]'));

		await expect(end.parentElement).toHaveClass('rcx-input-box__wrapper--end-addon-flush');
		await expect(end.nextElementSibling).toHaveClass('rcx-input-box__addon');
		await expect(end.nextElementSibling?.tagName).toBe('SPAN');

		await expect(plain.parentElement).toBe(canvasElement);
		await expect(plain).toHaveClass('consumer-input');
		await expect(plain).not.toHaveClass('rcx-input-box--undecorated');
	},
};

export const Modifiers: Story = {
	render: () => (
		<>
			<TextInput aria-label='small' small />
			<TextInput aria-label='visible placeholder' placeholderVisible placeholder='Shown' />
			<TextInput aria-label='plain' />
			<TextAreaInput aria-label='area' />
		</>
	),
	play: async ({ canvasElement }) => {
		const [small, shown, plain, area] = [...canvasElement.querySelectorAll<HTMLElement>('input, textarea')];
		await expect(small).toHaveClass('rcx-input-box--small', 'rcx-input-box--type-text');
		await expect(plain).not.toHaveClass('rcx-input-box--small');
		await expect(shown).toHaveClass('rcx-input-box--placeholder-visible');
		await expect(plain).not.toHaveClass('rcx-input-box--placeholder-visible');
		await expect(area).toHaveClass('rcx-input-box--type-textarea');
	},
};

export const Hidden: Story = {
	render: () => (
		<>
			<TextInput aria-label='hidden plain' hidden />
			<TextInput aria-label='hidden addon' hidden endAddon={<i />} />
			<TextInput aria-label='visible' />
		</>
	),
	play: async ({ canvasElement }) => {
		const [plain, addon, visible] = [...canvasElement.querySelectorAll('input')];
		await expect(plain).toHaveAttribute('hidden');
		await expect(addon.parentElement).toHaveAttribute('hidden');
		await expect(addon).not.toHaveAttribute('hidden');
		await expect(visible).not.toHaveAttribute('hidden');
	},
};

export const Disabled: Story = {
	render: () => (
		<>
			<TextInput aria-label='disabled' disabled />
			<TextInput aria-label='disabled addon' disabled endAddon={<i />} />
			<TextInput aria-label='enabled' />
		</>
	),
	play: async ({ canvasElement }) => {
		const [plain, addon, enabled] = [...canvasElement.querySelectorAll('input')];
		await expect(plain).toBeDisabled();
		await expect(addon).toBeDisabled();
		await expect(enabled).toBeEnabled();
	},
};

export const ErrorMakesTheControlInvalid: Story = {
	render: () => (
		<>
			<TextInput aria-label='with error' error='Required' />
			<TextInput aria-label='without error' />
			<TextAreaInput aria-label='area error' error='Too short' />
		</>
	),
	play: async ({ canvasElement }) => {
		const [withError, withoutError, area] = [...canvasElement.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')];
		await expect(withError).toBeInvalid();
		await expect(withError.validationMessage).toBe('Required');
		await expect(withoutError).toBeValid();
		await expect(area).toBeInvalid();
	},
};

export const NativeValidity: Story = {
	render: () => (
		<>
			<TextInput aria-label='required empty' required />
			<EmailInput aria-label='bad email' defaultValue='nope' />
			<InputBox type='date' aria-label='too early' defaultValue='2000-01-01' min='2020-01-01' />
		</>
	),
	play: async ({ canvasElement }) => {
		for (const input of canvasElement.querySelectorAll('input')) {
			await expect(input).toBeInvalid();
		}
	},
};

export const DateAndTimeAddon: Story = {
	render: () => (
		<>
			<InputBox type='date' aria-label='date' />
			<InputBox type='time' aria-label='time' />
			<InputBox type='date' aria-label='custom' endAddon={<i data-testid='custom' />} />
		</>
	),
	play: async ({ canvasElement }) => {
		const [date, time, custom] = [...canvasElement.querySelectorAll('input')];
		const icon = (input: HTMLInputElement) => input.nextElementSibling?.querySelector('.rcx-icon') ?? null;

		await expect(icon(date)).toHaveClass('rcx-icon--name-calendar');
		await expect(icon(time)).toHaveClass('rcx-icon--name-clock');
		// The default picker addon replaces a custom one on a date or time input
		await expect(icon(custom)).toHaveClass('rcx-icon--name-calendar');

		const showPicker = fn();
		date.showPicker = showPicker;
		(icon(date) as HTMLElement).click();
		await expect(showPicker).toHaveBeenCalledTimes(1);
	},
};

export const PasswordToggle: Story = {
	render: () => <PasswordInput aria-label='secret' defaultValue='hunter2' />,
	play: async ({ canvasElement }) => {
		const user = userEvent.setup();
		const input = canvasElement.querySelector('input') as HTMLInputElement;
		const icon = () => input.nextElementSibling?.querySelector('.rcx-icon') as HTMLElement;

		await expect(input).toHaveAttribute('type', 'password');
		await expect(icon()).toHaveClass('rcx-icon--name-eye-off');

		await user.click(icon());
		await waitFor(() => expect(input).toHaveAttribute('type', 'text'));
		await expect(icon()).toHaveClass('rcx-icon--name-eye');
	},
};

export const Skeleton: Story = {
	render: () => <InputBoxSkeleton id='skeleton-id' className='consumer-class' data-qa='skeleton-qa' title='skeleton title' />,
	play: async ({ canvasElement }) => {
		const skeleton = canvasElement.querySelector('.rcx-skeleton__input') as HTMLElement;
		await expectForwards(canvasElement, skeleton, {
			'className': 'consumer-class',
			'id': 'skeleton-id',
			'data-qa': 'skeleton-qa',
			'title': 'skeleton title',
		});
		await expect(skeleton).toHaveClass('rcx-skeleton__input');
		await expect(skeleton.querySelector('.rcx-skeleton')).not.toBeNull();
	},
};

const everyVariation = (
	<>
		<TextInput aria-label='Text' placeholder='Text' />
		<TextInput aria-label='Small' small />
		<TextInput aria-label='Error' error='Required' />
		<TextInput aria-label='Disabled' disabled />
		<TextInput aria-label='Start' startAddon={<span>@</span>} />
		<EmailInput aria-label='Email' />
		<PasswordInput aria-label='Password' />
		<NumberInput aria-label='Number' />
		<SearchInput aria-label='Search' />
		<UrlInput aria-label='Url' />
		<TextAreaInput aria-label='Area' />
		<InputBox type='date' aria-label='Date' />
		<InputBox type='time' aria-label='Time' />
	</>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- textbox "Text"',
				'- textbox "Small"',
				'- textbox "Error"',
				'- textbox "Disabled" [disabled]',
				'- text: "@"',
				'- textbox "Start"',
				'- textbox "Email"',
				'- textbox "Password"',
				'- spinbutton "Number"',
				'- searchbox "Search"',
				'- textbox "Url"',
				'- textbox "Area"',
				'- textbox "Date"',
				'- textbox "Time"',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > input[0]: rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--type-text',
				'root > input[1]: rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--small rcx-input-box--type-text',
				'root > input[2]: rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--type-text',
				'root > input[3]: rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--type-text',
				'root > label[0]: rcx-box rcx-box--animated rcx-box--full rcx-input-box__wrapper rcx-label',
				'root > label[0] > span: rcx-box rcx-box--full rcx-input-box__addon',
				'root > label[0] > input: rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--type-text rcx-input-box--undecorated',
				'root > input[4]: rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--type-email',
				'root > label[1]: rcx-box rcx-box--animated rcx-box--full rcx-input-box__wrapper rcx-label',
				'root > label[1] > input: rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--type-password rcx-input-box--undecorated',
				'root > label[1] > span: rcx-box rcx-box--full rcx-input-box__addon',
				'root > label[1] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-eye-off',
				'root > input[5]: rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--type-number',
				'root > input[6]: rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--type-search',
				'root > input[7]: rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--type-url',
				'root > textarea: rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--type-textarea',
				'root > label[2]: rcx-box rcx-box--animated rcx-box--full rcx-input-box__wrapper rcx-label',
				'root > label[2] > input: rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--type-date rcx-input-box--undecorated',
				'root > label[2] > span: rcx-box rcx-box--full rcx-input-box__addon',
				'root > label[2] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-calendar',
				'root > label[3]: rcx-box rcx-box--animated rcx-box--full rcx-input-box__wrapper rcx-label',
				'root > label[3] > input: rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--type-time rcx-input-box--undecorated',
				'root > label[3] > span: rcx-box rcx-box--full rcx-input-box__addon',
				'root > label[3] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-clock',
			].join('\n'),
		);
	},
};
