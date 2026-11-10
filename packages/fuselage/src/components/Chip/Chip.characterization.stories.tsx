import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn } from 'storybook/test';

import Chip from './Chip';
import { blankAvatar } from '../../../.storybook/helpers';
import { ariaSnapshot, classContract, expectForwards, expectKeyboardActivation } from '../../testing/g0';

// G0 characterization of Chip on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Chip',
	component: Chip,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Chip>;

type Story = StoryObj<typeof Chip>;

const onClick = fn();
const onMouseDown = fn();
const forwardedRef = createRef<HTMLButtonElement>();

// `ref` is forwarded at runtime but absent from the type withBoxStyling exposes, so it goes in through a spread
export const Forwarding: Story = {
	render: () => (
		<Chip
			{...{ ref: forwardedRef }}
			className='consumer-class'
			id='chip-id'
			title='chip title'
			data-qa='chip-qa'
			data-anything='anything'
			aria-label='chip label'
			name='chip-name'
			value='chip-value'
			tabIndex={-1}
			role='option'
			onClick={onClick}
			onMouseDown={onMouseDown}
			onFocus={fn()}
			onBlur={fn()}
			onMouseEnter={fn()}
			onMouseLeave={fn()}
			onKeyDown={fn()}
		>
			Marie Rowe
		</Chip>
	),
	play: async ({ canvasElement }) => {
		const chip = canvasElement.querySelector('button') as HTMLButtonElement;
		await expectForwards(canvasElement, chip, {
			'className': 'consumer-class',
			'id': 'chip-id',
			'title': 'chip title',
			'data-qa': 'chip-qa',
			'data-anything': 'anything',
			'aria-label': 'chip label',
			'ref': forwardedRef,
			'handlers': { onClick, onMouseDown },
		});
		await expect(chip).toHaveAttribute('name', 'chip-name');
		await expect(chip).toHaveAttribute('value', 'chip-value');
		await expect(chip).toHaveAttribute('tabindex', '-1');
		await expect(chip).toHaveAttribute('role', 'option');
		await expect(chip).toHaveAttribute('type', 'button');
	},
};

export const Handlers: Story = {
	render: () => (
		<>
			<Chip onClick={onClick}>Dismissable</Chip>
			<Chip>Static</Chip>
			<Chip disabled onClick={onClick}>
				Disabled
			</Chip>
		</>
	),
	play: async ({ canvasElement }) => {
		const [dismissable, fixed, disabled] = [...canvasElement.querySelectorAll('button')];
		onClick.mockClear();

		await expect(dismissable).toBeEnabled();
		await expect(fixed).toBeDisabled();
		await expect(disabled).toBeDisabled();

		dismissable.click();
		await expect(onClick).toHaveBeenCalledTimes(1);

		fixed.click();
		disabled.click();
		await expect(onClick).toHaveBeenCalledTimes(1);
	},
};

export const MouseDownOnly: Story = {
	render: () => <Chip onMouseDown={onMouseDown}>Pick</Chip>,
	play: async ({ canvasElement }) => {
		const chip = canvasElement.querySelector('button') as HTMLButtonElement;
		await expect(chip).toBeEnabled();
		await expect(chip.querySelector('.rcx-icon--name-cross')).not.toBeNull();
	},
};

export const KeyboardActivation: Story = {
	render: () => <Chip onClick={onClick}>Press</Chip>,
	play: async ({ canvasElement }) => {
		const chip = canvasElement.querySelector('button') as HTMLButtonElement;
		await expectKeyboardActivation(chip, onClick);
	},
};

export const Slots: Story = {
	render: () => (
		<>
			<Chip
				thumbUrl={blankAvatar}
				onClick={onClick}
				renderThumb={({ url }) => <img className='custom-thumb' src={url} alt='' />}
				renderDismissSymbol={() => <i className='custom-dismiss' />}
			>
				Custom
			</Chip>
			<Chip thumbUrl={blankAvatar} onClick={onClick} renderDismissSymbol={() => null}>
				No dismiss
			</Chip>
			<Chip onClick={onClick} />
		</>
	),
	play: async ({ canvasElement }) => {
		const [custom, bare, empty] = [...canvasElement.querySelectorAll('button')];
		await expect(custom.querySelector('img.custom-thumb')).toHaveAttribute('src', blankAvatar);
		await expect(custom.querySelector('i.custom-dismiss')).not.toBeNull();
		await expect(custom.querySelector('.rcx-icon')).toBeNull();
		await expect(bare.querySelector('.rcx-avatar')).not.toBeNull();
		await expect(bare.querySelector('.rcx-icon')).toBeNull();
		await expect(empty.querySelector('.rcx-chip__text')).toBeNull();
	},
};

const everyVariation = (
	<>
		<Chip>Static</Chip>
		<Chip onClick={onClick}>Dismissable</Chip>
		<Chip thumbUrl={blankAvatar} onClick={onClick}>
			With thumb
		</Chip>
		<Chip small onClick={onClick}>
			Small
		</Chip>
		<Chip label>Label</Chip>
		<Chip disabled onClick={onClick}>
			Disabled
		</Chip>
	</>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- button "Static" [disabled]',
				'- button "Dismissable"',
				'- button "With thumb":',
				'  - img',
				'- button "Small"',
				'- button "Label" [disabled]',
				'- button "Disabled" [disabled]',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > button[0]: rcx-box rcx-chip',
				'root > button[0] > span: rcx-box rcx-chip__text',
				'root > button[1]: rcx-box rcx-chip',
				'root > button[1] > span: rcx-box rcx-chip__text',
				'root > button[1] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-cross',
				'root > button[2]: rcx-box rcx-chip',
				'root > button[2] > div: rcx-avatar rcx-box rcx-box--full',
				'root > button[2] > div > figure: rcx-avatar rcx-avatar--x20 rcx-box rcx-box--full',
				'root > button[2] > div > figure > img: rcx-avatar__element rcx-avatar__element--x20',
				'root > button[2] > span: rcx-box rcx-chip__text',
				'root > button[2] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-cross',
				'root > button[3]: rcx-box rcx-chip rcx-chip--small',
				'root > button[3] > span: rcx-box rcx-chip__text',
				'root > button[3] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-cross',
				'root > button[4]: rcx-box rcx-chip rcx-chip--label',
				'root > button[4] > span: rcx-box rcx-chip__text',
				'root > button[5]: rcx-box rcx-chip',
				'root > button[5] > span: rcx-box rcx-chip__text',
				'root > button[5] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-cross',
			].join('\n'),
		);
	},
};
