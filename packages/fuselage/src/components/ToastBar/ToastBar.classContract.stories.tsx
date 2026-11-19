import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn } from 'storybook/test';

import ToastBar from './ToastBar';
import { classContract } from '../../testing/g0';

// The class contract of ToastBar with the IconButton frame in it, which holds its glyph in a content part: `button > span > i`.
export default {
	title: 'Characterization/ToastBarClassContract',
	component: ToastBar,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof ToastBar>;

type Story = StoryObj<typeof ToastBar>;

const onClose = fn();

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
