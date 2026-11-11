import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn } from 'storybook/test';

import Field from './Field';
import FieldDescription from './FieldDescription';
import FieldError from './FieldError';
import FieldHint from './FieldHint';
import FieldLabel from './FieldLabel';
import FieldLabelInfo from './FieldLabelInfo';
import FieldLink from './FieldLink';
import FieldRow from './FieldRow';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';
import { TextInput } from '../TextInput';

// G0 characterization of the Field family on its develop implementation. A rewrite passes these unedited, in jest and in the
// compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Field',
	component: Field,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Field>;

type Story = StoryObj<typeof Field>;

const handlers = () => ({ onClick: fn(), onMouseEnter: fn() });

const refs = {
	field: createRef<HTMLDivElement>(),
	row: createRef<HTMLSpanElement>(),
	label: createRef<HTMLLabelElement>(),
	description: createRef<HTMLSpanElement>(),
	hint: createRef<HTMLSpanElement>(),
	error: createRef<HTMLSpanElement>(),
	link: createRef<HTMLAnchorElement>(),
};

const spy = {
	field: handlers(),
	row: handlers(),
	label: handlers(),
	description: handlers(),
	hint: handlers(),
	error: handlers(),
	link: handlers(),
};

const common = (name: string) => ({
	'className': `${name}-consumer`,
	'id': `${name}-id`,
	'title': `${name} title`,
	'data-qa': `${name}-qa`,
	'data-anything': 'anything',
	'aria-label': `${name} aria`,
});

export const Forwarding: Story = {
	render: () => (
		<Field {...{ ref: refs.field }} {...common('field')} {...spy.field}>
			<FieldLabel {...{ ref: refs.label }} {...common('label')} {...spy.label} htmlFor='forwarding-input'>
				Label
			</FieldLabel>
			<FieldRow {...{ ref: refs.row }} {...common('row')} {...spy.row}>
				<TextInput id='forwarding-input' />
			</FieldRow>
			<FieldDescription {...{ ref: refs.description }} {...common('description')} {...spy.description}>
				Description
			</FieldDescription>
			<FieldHint {...{ ref: refs.hint }} {...common('hint')} {...spy.hint}>
				Hint
			</FieldHint>
			<FieldError {...{ ref: refs.error }} {...common('error')} {...spy.error}>
				Error
			</FieldError>
			<FieldLink {...{ ref: refs.link }} {...common('link')} {...spy.link} href='https://example.com' target='_blank' rel='noreferrer'>
				Link
			</FieldLink>
		</Field>
	),
	play: async ({ canvasElement }) => {
		const part = (selector: string) => canvasElement.querySelector(selector) as HTMLElement;

		await expectForwards(canvasElement, part('.rcx-field'), { ...common('field'), ref: refs.field, handlers: spy.field });
		await expectForwards(canvasElement, part('.rcx-field__label'), { ...common('label'), ref: refs.label, handlers: spy.label });
		await expectForwards(canvasElement, part('.rcx-field__row'), { ...common('row'), ref: refs.row, handlers: spy.row });
		await expectForwards(canvasElement, part('.rcx-field__description'), {
			...common('description'),
			ref: refs.description,
			handlers: spy.description,
		});
		await expectForwards(canvasElement, part('.rcx-field__hint'), { ...common('hint'), ref: refs.hint, handlers: spy.hint });
		await expectForwards(canvasElement, part('.rcx-field__error'), { ...common('error'), ref: refs.error, handlers: spy.error });
		await expectForwards(canvasElement, part('.rcx-field__link'), { ...common('link'), ref: refs.link, handlers: spy.link });

		await expect(part('.rcx-field__label')).toHaveAttribute('for', 'forwarding-input');
		await expect(part('.rcx-field__link')).toHaveAttribute('href', 'https://example.com');
		await expect(part('.rcx-field__link')).toHaveAttribute('target', '_blank');
		await expect(part('.rcx-field__link')).toHaveAttribute('rel', 'noreferrer');
	},
};

export const Tags: Story = {
	render: () => (
		<Field>
			<FieldLabel>Label</FieldLabel>
			<FieldRow>
				<span>Row</span>
			</FieldRow>
			<FieldDescription>Description</FieldDescription>
			<FieldHint>Hint</FieldHint>
			<FieldError>Error</FieldError>
			<FieldLink href='#'>Link</FieldLink>
		</Field>
	),
	play: async ({ canvasElement }) => {
		const tag = (selector: string) => canvasElement.querySelector(selector)?.tagName;
		await expect(tag('.rcx-field')).toBe('DIV');
		await expect(tag('.rcx-field__label')).toBe('LABEL');
		await expect(tag('.rcx-field__row')).toBe('SPAN');
		await expect(tag('.rcx-field__description')).toBe('SPAN');
		await expect(tag('.rcx-field__hint')).toBe('SPAN');
		await expect(tag('.rcx-field__error')).toBe('SPAN');
		await expect(tag('.rcx-field__link')).toBe('A');
	},
};

export const RowJustify: Story = {
	render: () => (
		<Field>
			<FieldRow justify='end'>
				<span>End</span>
			</FieldRow>
			<FieldRow>
				<span>Start</span>
			</FieldRow>
		</Field>
	),
	play: async ({ canvasElement }) => {
		const [end, start] = [...canvasElement.querySelectorAll('.rcx-field__row')];
		await expect(end).toHaveClass('rcx-field__row--justify-end');
		await expect(start).not.toHaveClass('rcx-field__row--justify-end');
	},
};

export const LabelParts: Story = {
	render: () => (
		<Field>
			<FieldLabel required htmlFor='parts-input'>
				Required
				<FieldLabelInfo id='parts-info' title='About it' />
			</FieldLabel>
			<FieldLabel is='span' id='span-label'>
				Span
			</FieldLabel>
		</Field>
	),
	play: async ({ canvasElement }) => {
		const [label, span] = [...canvasElement.querySelectorAll('.rcx-field__label')];
		await expect(label.tagName).toBe('LABEL');
		await expect(label).toHaveClass('rcx-label');
		await expect(label.querySelector('.rcx-label__required')).toHaveTextContent('*');
		await expect(label.querySelector('.rcx-label__info')).not.toBeNull();
		await expect(label.querySelector('span[hidden]')).toHaveAttribute('id', 'parts-info');
		await expect(span.tagName).toBe('SPAN');
	},
};

// The text parts hold consumer markup
export const RichText: Story = {
	render: () => (
		<Field>
			<FieldDescription>
				<a href='#a'>link</a> and <code>code</code> and <strong>strong</strong>
			</FieldDescription>
			<FieldHint>
				<a href='#b'>link</a>
			</FieldHint>
			<FieldError>
				<a href='#c'>link</a>
			</FieldError>
			<FieldLink href='#d'>
				<strong>link</strong>
			</FieldLink>
		</Field>
	),
	play: async ({ canvasElement }) => {
		for (const part of ['description', 'hint', 'error', 'link']) {
			const element = canvasElement.querySelector(`.rcx-field__${part}`) as HTMLElement;
			await expect(element.children.length).toBeGreaterThan(0);
		}
	},
};

const everyVariation = (
	<>
		<Field>
			<FieldLabel required htmlFor='a'>
				Label
				<FieldLabelInfo title='Info' />
			</FieldLabel>
			<FieldRow>
				<TextInput id='a' />
			</FieldRow>
			<FieldDescription>Description</FieldDescription>
			<FieldHint>Hint</FieldHint>
			<FieldError>Error</FieldError>
			<FieldLink href='#'>Link</FieldLink>
		</Field>
		<Field>
			<FieldRow justify='end'>
				<span>End</span>
			</FieldRow>
		</Field>
	</>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- text: "Label"',
				'- textbox "Label"',
				'- text: "Description"',
				'- text: "Hint"',
				'- text: "Error"',
				'- link "Link"',
				'- text: "End"',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div[0]: rcx-box rcx-box--full rcx-field',
				'root > div[0] > label: rcx-box rcx-box--full rcx-field__label rcx-label',
				'root > div[0] > label > span[0]: rcx-box rcx-box--full rcx-label__info',
				'root > div[0] > label > span[0] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-info-circled',
				'root > div[0] > label > span[1]: rcx-box rcx-box--full rcx-label__required',
				'root > div[0] > span[0]: rcx-box rcx-box--full rcx-field__row',
				'root > div[0] > span[0] > input: rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--type-text',
				'root > div[0] > span[1]: rcx-box rcx-box--full rcx-box--with-inline-elements rcx-field__description',
				'root > div[0] > span[2]: rcx-box rcx-box--full rcx-box--with-inline-elements rcx-field__hint',
				'root > div[0] > span[3]: rcx-box rcx-box--full rcx-box--with-inline-elements rcx-field__error',
				'root > div[0] > a: rcx-box rcx-box--full rcx-box--with-inline-elements rcx-field__link',
				'root > div[1]: rcx-box rcx-box--full rcx-field',
				'root > div[1] > span: rcx-box rcx-box--full rcx-field__row rcx-field__row--justify-end',
			].join('\n'),
		);
	},
};
