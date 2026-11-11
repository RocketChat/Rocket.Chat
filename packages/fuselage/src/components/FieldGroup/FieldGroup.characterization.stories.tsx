import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn } from 'storybook/test';

import FieldGroup from './FieldGroup';
import { expectForwards, classContract, ariaSnapshot } from '../../testing/g0';
import { Field, FieldLabel, FieldRow } from '../Field';
import { TextInput } from '../TextInput';

// G0 characterization of FieldGroup on its develop implementation. A rewrite passes these unedited, in jest and in the
// compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/FieldGroup',
	component: FieldGroup,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof FieldGroup>;

type Story = StoryObj<typeof FieldGroup>;

const onClick = fn();
const forwardedRef = createRef<HTMLFieldSetElement>();

const fields = (
	<>
		<Field>
			<FieldLabel htmlFor='group-a'>A</FieldLabel>
			<FieldRow>
				<TextInput id='group-a' />
			</FieldRow>
		</Field>
		<Field>
			<FieldLabel htmlFor='group-b'>B</FieldLabel>
			<FieldRow>
				<TextInput id='group-b' />
			</FieldRow>
		</Field>
	</>
);

export const Forwarding: Story = {
	render: () => (
		<FieldGroup
			{...{ ref: forwardedRef }}
			className='consumer-class'
			id='group-id'
			title='group title'
			data-qa='group-qa'
			data-anything='anything'
			aria-label='group label'
			form='some-form'
			name='group-name'
			onClick={onClick}
		>
			{fields}
		</FieldGroup>
	),
	play: async ({ canvasElement }) => {
		const group = canvasElement.querySelector('fieldset') as HTMLFieldSetElement;
		await expectForwards(canvasElement, group, {
			'className': 'consumer-class',
			'id': 'group-id',
			'title': 'group title',
			'data-qa': 'group-qa',
			'data-anything': 'anything',
			'aria-label': 'group label',
			'ref': forwardedRef,
			'handlers': { onClick },
		});
		await expect(group).toHaveAttribute('role', 'group');
		await expect(group).toHaveAttribute('form', 'some-form');
		await expect(group).toHaveAttribute('name', 'group-name');
	},
};

export const Disabled: Story = {
	render: () => (
		<>
			<FieldGroup disabled>{fields}</FieldGroup>
			<FieldGroup>{fields}</FieldGroup>
		</>
	),
	play: async ({ canvasElement }) => {
		const [disabled, enabled] = [...canvasElement.querySelectorAll('fieldset')];
		for (const input of disabled.querySelectorAll('input')) {
			await expect(input).toBeDisabled();
		}
		for (const input of enabled.querySelectorAll('input')) {
			await expect(input).toBeEnabled();
		}
	},
};

export const ChildrenPatching: Story = {
	render: () => (
		<FieldGroup>
			<Field className='consumer-field'>
				<FieldRow>
					<span>one</span>
				</FieldRow>
			</Field>
			<Field>
				<FieldRow>
					<span>two</span>
				</FieldRow>
			</Field>
		</FieldGroup>
	),
	play: async ({ canvasElement }) => {
		const [first, second] = [...canvasElement.querySelectorAll('.rcx-field')];
		await expect(first).toHaveClass('consumer-field');
		await expect(first).not.toHaveClass('rcx-field-group__item');
		await expect(second).not.toHaveClass('rcx-field-group__item');
	},
};

export const AriaTree: Story = {
	render: () => (
		<>
			<FieldGroup aria-label='Enabled'>{fields}</FieldGroup>
			<FieldGroup aria-label='Disabled' disabled>
				{fields}
			</FieldGroup>
		</>
	),
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- group "Enabled":',
				'  - text: "A"',
				'  - textbox "A A"',
				'  - text: "B"',
				'  - textbox "B B"',
				'- group "Disabled" [disabled]:',
				'  - text: "A"',
				'  - textbox',
				'  - text: "B"',
				'  - textbox',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => <FieldGroup>{fields}</FieldGroup>,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > fieldset: rcx-box rcx-box--full rcx-field-group',
				'root > fieldset > div[0]: rcx-box rcx-box--full rcx-field',
				'root > fieldset > div[0] > label: rcx-box rcx-box--full rcx-field__label rcx-label',
				'root > fieldset > div[0] > span: rcx-box rcx-box--full rcx-field__row',
				'root > fieldset > div[0] > span > input: rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--type-text',
				'root > fieldset > div[1]: rcx-box rcx-box--full rcx-field',
				'root > fieldset > div[1] > label: rcx-box rcx-box--full rcx-field__label rcx-label',
				'root > fieldset > div[1] > span: rcx-box rcx-box--full rcx-field__row',
				'root > fieldset > div[1] > span > input: rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--type-text',
			].join('\n'),
		);
	},
};
