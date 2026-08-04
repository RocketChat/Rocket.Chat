import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';
import { action } from 'storybook/actions';

import GenericModal, { GenericModalDoNotAskAgain } from './GenericModal';

export default {
	component: GenericModal,
	subcomponents: { GenericModalDoNotAskAgain: GenericModalDoNotAskAgain as ComponentType<any> },
	args: {
		children: 'This is the content.',
	},
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
		actions: { argTypesRegex: '^on.*' },
	},
} satisfies Meta<typeof GenericModal>;

export const Example: StoryObj<typeof GenericModal> = {
	render: () => (
		<GenericModal
			title='Oh Myyy!'
			variant='warning'
			confirmText='Yay'
			cancelText='Nay'
			onConfirm={action('onConfirm')}
			onCancel={action('onCancel')}
			onClose={action('onClose')}
		>
			The quick brown fox jumps over the lazy dog.
		</GenericModal>
	),
};

export const Info: StoryObj<typeof GenericModal> = { args: { variant: 'info' } };

export const Danger: StoryObj<typeof GenericModal> = { args: { variant: 'danger' } };

export const Warning: StoryObj<typeof GenericModal> = { args: { variant: 'warning' } };

export const Success: StoryObj<typeof GenericModal> = { args: { variant: 'success' } };

export const DangerSecondary: StoryObj<typeof GenericModal> = { args: { variant: 'secondary-danger' } };

export const WithDontAskAgain: StoryObj<typeof GenericModalDoNotAskAgain> = {
	render: (args) => <GenericModalDoNotAskAgain {...args} />,
	args: {
		dontAskAgain: {
			action: 'action',
			label: 'label',
		},
	},
};
