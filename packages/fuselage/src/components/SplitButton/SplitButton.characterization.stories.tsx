import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn } from 'storybook/test';

import { ariaSnapshot, classContract, expectForwards, expectKeyboardActivation, expectTabOrder } from '../../testing/g0';
import { Button } from '../Button';
import SplitButton from './SplitButton';
import SplitButtonTrigger from './SplitButtonTrigger';

// G0 characterization of SplitButton and SplitButtonTrigger on their develop implementation. A rewrite passes these unedited,
// in jest and in the compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/SplitButton',
	component: SplitButton,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof SplitButton>;

type Story = StoryObj<typeof SplitButton>;

const onClick = fn();
const onTriggerClick = fn();
const forwardedRef = createRef<HTMLDivElement>();
const triggerRef = createRef<HTMLButtonElement>();

export const Forwarding: Story = {
	render: () => (
		<SplitButton
			ref={forwardedRef}
			className='consumer-class'
			id='split-id'
			title='split title'
			data-qa='split-qa'
			data-anything='anything'
			aria-label='Microphone'
			onClick={onClick}
		>
			<Button square icon='mic' aria-label='Mute' />
			<SplitButtonTrigger
				ref={triggerRef}
				icon='chevron-down'
				className='consumer-trigger'
				id='trigger-id'
				title='trigger title'
				data-qa='trigger-qa'
				data-anything='trigger-anything'
				aria-label='Settings'
				onClick={onTriggerClick}
			/>
		</SplitButton>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '.rcx-split-button', {
			'className': 'consumer-class',
			'id': 'split-id',
			'title': 'split title',
			'data-qa': 'split-qa',
			'data-anything': 'anything',
			'aria-label': 'Microphone',
			'ref': forwardedRef,
			'handlers': { onClick },
		});
		await expectForwards(canvasElement, '.rcx-split-button__trigger', {
			'className': 'consumer-trigger',
			'id': 'trigger-id',
			'title': 'trigger title',
			'data-qa': 'trigger-qa',
			'data-anything': 'trigger-anything',
			'aria-label': 'Settings',
			'ref': triggerRef,
			'handlers': { onClick: onTriggerClick },
		});
	},
};

export const Keyboard: Story = {
	render: () => (
		<SplitButton aria-label='Microphone'>
			<Button square icon='mic' aria-label='Mute' onClick={onClick} />
			<SplitButtonTrigger icon='chevron-down' aria-label='Settings' onClick={onTriggerClick} />
		</SplitButton>
	),
	play: async ({ canvasElement }) => {
		const [action, trigger] = [...canvasElement.querySelectorAll('button')];
		onClick.mockClear();
		onTriggerClick.mockClear();
		await expectTabOrder([action, trigger]);
		await expectKeyboardActivation(action, onClick);
		await expectKeyboardActivation(trigger, onTriggerClick);
	},
};

const everyVariation = (
	<>
		<SplitButton aria-label='Default'>
			<Button square icon='mic' aria-label='Mute' />
			<SplitButtonTrigger icon='chevron-down' aria-label='Settings' />
		</SplitButton>
		<SplitButton danger aria-label='Danger'>
			<Button square variant='danger' icon='phone-off' aria-label='Leave' />
			<SplitButtonTrigger icon='chevron-down' aria-label='Danger settings' />
		</SplitButton>
		<SplitButton warning aria-label='Warning'>
			<Button square variant='warning' icon='hand' aria-label='Raise' />
			<SplitButtonTrigger icon='chevron-down' aria-label='Warning settings' />
		</SplitButton>
		<SplitButton success aria-label='Success'>
			<Button square variant='success' icon='phone' aria-label='Answer' />
			<SplitButtonTrigger icon='chevron-down' aria-label='Success settings' />
		</SplitButton>
		<SplitButton primary aria-label='Primary'>
			<Button square variant='primary' icon='camera' aria-label='Camera' />
			<SplitButtonTrigger icon='chevron-down' aria-label='Primary settings' />
		</SplitButton>
	</>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- group "Default":',
				'  - button "Mute"',
				'  - button "Settings"',
				'- group "Danger":',
				'  - button "Leave"',
				'  - button "Danger settings"',
				'- group "Warning":',
				'  - button "Raise"',
				'  - button "Warning settings"',
				'- group "Success":',
				'  - button "Answer"',
				'  - button "Success settings"',
				'- group "Primary":',
				'  - button "Camera"',
				'  - button "Primary settings"',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div[0]: rcx-split-button',
				'root > div[0] > button[0]: rcx-box rcx-box--full rcx-button rcx-button--square',
				'root > div[0] > button[0] > span: rcx-button--content',
				'root > div[0] > button[0] > span > i: rcx-box rcx-box--full rcx-button__icon rcx-icon rcx-icon--name-mic',
				'root > div[0] > button[1]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--large-square rcx-button--square rcx-split-button__trigger',
				'root > div[0] > button[1] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
				'root > div[1]: rcx-split-button rcx-split-button--danger',
				'root > div[1] > button[0]: rcx-box rcx-box--full rcx-button rcx-button--danger rcx-button--square',
				'root > div[1] > button[0] > span: rcx-button--content',
				'root > div[1] > button[0] > span > i: rcx-box rcx-box--full rcx-button__icon rcx-icon rcx-icon--name-phone-off',
				'root > div[1] > button[1]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--large-square rcx-button--square rcx-split-button__trigger',
				'root > div[1] > button[1] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
				'root > div[2]: rcx-split-button rcx-split-button--warning',
				'root > div[2] > button[0]: rcx-box rcx-box--full rcx-button rcx-button--square rcx-button--warning',
				'root > div[2] > button[0] > span: rcx-button--content',
				'root > div[2] > button[0] > span > i: rcx-box rcx-box--full rcx-button__icon rcx-icon rcx-icon--name-hand',
				'root > div[2] > button[1]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--large-square rcx-button--square rcx-split-button__trigger',
				'root > div[2] > button[1] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
				'root > div[3]: rcx-split-button rcx-split-button--success',
				'root > div[3] > button[0]: rcx-box rcx-box--full rcx-button rcx-button--square rcx-button--success',
				'root > div[3] > button[0] > span: rcx-button--content',
				'root > div[3] > button[0] > span > i: rcx-box rcx-box--full rcx-button__icon rcx-icon rcx-icon--name-phone',
				'root > div[3] > button[1]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--large-square rcx-button--square rcx-split-button__trigger',
				'root > div[3] > button[1] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
				'root > div[4]: rcx-split-button rcx-split-button--primary',
				'root > div[4] > button[0]: rcx-box rcx-box--full rcx-button rcx-button--primary rcx-button--square',
				'root > div[4] > button[0] > span: rcx-button--content',
				'root > div[4] > button[0] > span > i: rcx-box rcx-box--full rcx-button__icon rcx-icon rcx-icon--name-camera',
				'root > div[4] > button[1]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--large-square rcx-button--square rcx-split-button__trigger',
				'root > div[4] > button[1] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
			].join('\n'),
		);
	},
};
