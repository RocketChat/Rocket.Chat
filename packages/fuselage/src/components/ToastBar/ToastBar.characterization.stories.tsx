import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fireEvent, fn } from 'storybook/test';

import ToastBar from './ToastBar';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';

// G0 characterization of ToastBar on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/ToastBar',
	component: ToastBar,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof ToastBar>;

type Story = StoryObj<typeof ToastBar>;

const onPointerEnter = fn();
const onPointerLeave = fn();
const onClose = fn();
const forwardedRef = createRef<HTMLDivElement>();

// What fuselage-toastbar's ToastBarTimed passes: the pointer handlers that pause the countdown and the id
export const Forwarding: Story = {
	render: () => (
		<ToastBar
			{...{ ref: forwardedRef }}
			className='consumer-class'
			id='toast-id'
			title='toast title'
			data-qa='toast-qa'
			data-anything='anything'
			aria-label='toast label'
			variant='success'
			time={3}
			onPointerEnter={onPointerEnter}
			onPointerLeave={onPointerLeave}
			onClose={onClose}
		>
			Saved
		</ToastBar>
	),
	play: async ({ canvasElement }) => {
		const toast = canvasElement.querySelector('.rcx-toastbar') as HTMLElement;
		await expectForwards(canvasElement, toast, {
			'id': 'toast-id',
			'title': 'toast title',
			'data-qa': 'toast-qa',
			'data-anything': 'anything',
			'aria-label': 'toast label',
			'ref': forwardedRef,
		});
		// React derives pointer enter and leave from the bubbling over and out events
		await fireEvent.pointerOver(toast);
		await expect(onPointerEnter).toHaveBeenCalled();
		await fireEvent.pointerOut(toast);
		await expect(onPointerLeave).toHaveBeenCalled();
		await expect(toast).toHaveClass('rcx-toastbar', 'rcx-toastbar--success', 'consumer-class');
	},
};

export const Dismiss: Story = {
	render: () => (
		<>
			<ToastBar id='with-id' onClose={onClose} buttonLabel='Close it'>
				With id
			</ToastBar>
			<ToastBar onClose={onClose}>Without id</ToastBar>
			<ToastBar>Not dismissable</ToastBar>
		</>
	),
	play: async ({ canvasElement }) => {
		onClose.mockClear();
		const [withId, withoutId, fixed] = [...canvasElement.querySelectorAll<HTMLElement>('.rcx-toastbar')];

		const close = withId.querySelector('button') as HTMLButtonElement;
		await expect(close).toHaveAttribute('aria-label', 'Close it');
		close.click();
		await expect(onClose).toHaveBeenLastCalledWith('with-id');

		const generated = withoutId.querySelector('button') as HTMLButtonElement;
		await expect(generated).toHaveAttribute('aria-label', 'Dismiss alert');
		generated.click();
		await expect(onClose).toHaveBeenCalledTimes(2);
		await expect(typeof onClose.mock.calls[1][0]).toBe('string');
		await expect(onClose.mock.calls[1][0]).not.toBe('');

		await expect(fixed.querySelector('button')).toBeNull();
	},
};

export const Roles: Story = {
	render: () => (
		<>
			<ToastBar>Default</ToastBar>
			<ToastBar variant='info'>Info</ToastBar>
			<ToastBar variant='success'>Success</ToastBar>
			<ToastBar variant='error'>Error</ToastBar>
		</>
	),
	play: async ({ canvasElement }) => {
		const roles = [...canvasElement.querySelectorAll('[role]')].map((element) => element.getAttribute('role'));
		await expect(roles).toEqual(['status', 'status', 'status', 'alert']);
	},
};

export const Progress: Story = {
	render: () => (
		<>
			<ToastBar time={3}>Running</ToastBar>
			<ToastBar time={3} isPaused>
				Paused
			</ToastBar>
		</>
	),
	play: async ({ canvasElement }) => {
		const [running, paused] = [...canvasElement.querySelectorAll('.rcx-toastbar_progressbar')];
		await expect(running).not.toHaveClass('rcx-toastbar_progressbar--paused');
		await expect(paused).toHaveClass('rcx-toastbar_progressbar--paused');

		// jsdom has no pseudo-element styles; in a browser the duration is the `time` and the pause is the play state
		if (navigator.userAgent.includes('jsdom')) return;
		const runningBar = getComputedStyle(running, '::after');
		const pausedBar = getComputedStyle(paused, '::after');
		await expect(runningBar.animationDuration).toBe('3s');
		await expect(runningBar.animationPlayState).toBe('running');
		await expect(pausedBar.animationPlayState).toBe('paused');
	},
};

const everyVariation = (
	<>
		<ToastBar>Info</ToastBar>
		<ToastBar variant='success' onClose={onClose}>
			Success
		</ToastBar>
		<ToastBar variant='error' isPaused>
			Error
		</ToastBar>
	</>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- status:',
				'  - text: "Info"',
				'- status:',
				'  - text: "Success"',
				'- button "Dismiss alert"',
				'- alert:',
				'  - text: "Error"',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		const box = 'rcx-box rcx-box--full';
		await expect(classContract(canvasElement)).toBe(
			[
				`root > div[0]: ${box} rcx-toastbar rcx-toastbar--info`,
				`root > div[0] > div[0]: rcx-toastbar_inner`,
				`root > div[0] > div[0] > i: ${box} rcx-icon rcx-icon--name-info rcx-toastbar_icon--info`,
				'root > div[0] > div[0] > div: rcx-toastbar_content',
				`root > div[0] > div[1]: ${box} rcx-toastbar_progressbar`,
				`root > div[1]: ${box} rcx-toastbar rcx-toastbar--success`,
				'root > div[1] > div[0]: rcx-toastbar_inner',
				`root > div[1] > div[0] > i: ${box} rcx-icon rcx-icon--name-circle-check rcx-toastbar_icon--success`,
				'root > div[1] > div[0] > div[0]: rcx-toastbar_content',
				'root > div[1] > div[0] > div[1]: rcx-toastbar-close',
				`root > div[1] > div[0] > div[1] > button: ${box} rcx-button rcx-button--icon rcx-button--square rcx-button--tiny-square`,
				`root > div[1] > div[0] > div[1] > button > span > i: ${box} rcx-icon rcx-icon--name-cross`,
				`root > div[1] > div[1]: ${box} rcx-toastbar_progressbar`,
				`root > div[2]: ${box} rcx-toastbar rcx-toastbar--error`,
				'root > div[2] > div[0]: rcx-toastbar_inner',
				`root > div[2] > div[0] > i: ${box} rcx-icon rcx-icon--name-ban rcx-toastbar_icon--error`,
				'root > div[2] > div[0] > div: rcx-toastbar_content',
				`root > div[2] > div[1]: ${box} rcx-toastbar_progressbar rcx-toastbar_progressbar--paused`,
			].join('\n'),
		);
	},
};
