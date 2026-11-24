import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn } from 'storybook/test';

import Label from './Label';
import { LabelInfo } from './LabelInfo';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';

// G0 characterization of Label and LabelInfo on their develop implementation. A rewrite passes these unedited, in jest and
// in the compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Label',
	component: Label,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Label>;

type Story = StoryObj<typeof Label>;

const onClick = fn();
const forwardedRef = createRef<HTMLLabelElement>();

export const Forwarding: Story = {
	render: () => (
		<Label
			{...{ ref: forwardedRef }}
			className='consumer-class'
			id='label-id'
			title='label title'
			data-qa='label-qa'
			data-anything='anything'
			aria-label='label aria'
			htmlFor='some-input'
			onClick={onClick}
		>
			Name
		</Label>
	),
	play: async ({ canvasElement }) => {
		const label = canvasElement.querySelector('label') as HTMLLabelElement;
		await expectForwards(canvasElement, label, {
			'className': 'consumer-class',
			'id': 'label-id',
			'title': 'label title',
			'data-qa': 'label-qa',
			'data-anything': 'anything',
			'aria-label': 'label aria',
			'ref': forwardedRef,
			'handlers': { onClick },
		});
		await expect(label).toHaveAttribute('for', 'some-input');
	},
};

export const Polymorphism: Story = {
	render: () => (
		<>
			<Label is='span'>Span</Label>
			<Label>
				Outer
				<Label>Nested</Label>
			</Label>
		</>
	),
	play: async ({ canvasElement }) => {
		const [span, outer] = [...canvasElement.querySelectorAll<HTMLElement>('.rcx-label')];
		await expect(span.tagName).toBe('SPAN');
		await expect(outer.tagName).toBe('LABEL');
		await expect(outer.querySelector('.rcx-label')?.tagName).toBe('SPAN');
	},
};

export const Required: Story = {
	render: () => (
		<>
			<Label required>Required</Label>
			<Label>Optional</Label>
		</>
	),
	play: async ({ canvasElement }) => {
		const [required, optional] = [...canvasElement.querySelectorAll('label')];
		const mark = required.querySelector('.rcx-label__required') as HTMLElement;
		await expect(mark).toHaveTextContent('*');
		await expect(mark).toHaveAttribute('aria-hidden', 'true');
		await expect(mark.tagName).toBe('SPAN');
		await expect(optional.querySelector('.rcx-label__required')).toBeNull();
	},
};

export const Disabled: Story = {
	render: () => (
		<>
			<Label disabled>Disabled</Label>
			<Label>Enabled</Label>
		</>
	),
	play: async ({ canvasElement }) => {
		const [disabled, enabled] = [...canvasElement.querySelectorAll('label')];
		await expect(disabled).toHaveClass('rcx-label--disabled');
		await expect(enabled).not.toHaveClass('rcx-label--disabled');
	},
};

export const Info: Story = {
	render: () => (
		<Label>
			Name
			<LabelInfo id='info-id' title='More about the name' data-qa='info-qa' />
			<LabelInfo title='Second' />
		</Label>
	),
	play: async ({ canvasElement }) => {
		const [info, second] = [...canvasElement.querySelectorAll('.rcx-label__info')];
		await expect(info.tagName).toBe('SPAN');
		const hidden = info.querySelector('span[hidden]') as HTMLElement;
		await expect(hidden).toHaveAttribute('id', 'info-id');
		await expect(hidden).toHaveTextContent('More about the name');
		await expect(info.querySelector('.rcx-icon--name-info-circled')).not.toBeNull();
		await expect(info.querySelector('.rcx-icon')).toHaveAttribute('title', 'More about the name');
		await expect(info.querySelector('.rcx-icon')).toHaveAttribute('data-qa', 'info-qa');
		await expect(second.querySelector('span[hidden]')).not.toHaveAttribute('id');
	},
};

const everyVariation = (
	<>
		<Label>Default</Label>
		<Label required>Required</Label>
		<Label disabled>Disabled</Label>
		<Label is='span'>Span</Label>
		<Label>
			With info
			<LabelInfo title='Info' />
		</Label>
	</>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			['- text: "Default"', '- text: "Required"', '- text: "Disabled"', '- text: "Span"', '- text: "With info"'].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > label[0]: rcx-box rcx-box--full rcx-label',
				'root > label[1]: rcx-box rcx-box--full rcx-label',
				'root > label[1] > span: rcx-box rcx-box--full rcx-label__required',
				'root > label[2]: rcx-box rcx-box--full rcx-label rcx-label--disabled',
				'root > span: rcx-box rcx-box--full rcx-label',
				'root > label[3]: rcx-box rcx-box--full rcx-label',
				'root > label[3] > span: rcx-box rcx-box--full rcx-label__info',
				'root > label[3] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-info-circled',
			].join('\n'),
		);
	},
};
