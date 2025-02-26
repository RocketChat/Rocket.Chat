import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';
import type { ComponentType } from 'react';

import GenericModal, { GenericModalDoNotAskAgain } from './GenericModal';

export default {
	title: 'Components/GenericModal',
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

export const Example: StoryFn<typeof GenericModal> = () => (
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
);

const Template: StoryFn<typeof GenericModal> = (args) => <GenericModal {...args} />;

export const Info = Template.bind({});
Info.args = { variant: 'info' };

export const Danger = Template.bind({});
Danger.args = { variant: 'danger' };

export const Warning = Template.bind({});
Warning.args = { variant: 'warning' };

export const Success = Template.bind({});
Success.args = { variant: 'success' };

export const WithDontAskAgain: StoryFn<typeof GenericModalDoNotAskAgain> = (args) => <GenericModalDoNotAskAgain {...args} />;
WithDontAskAgain.args = {
	dontAskAgain: {
		action: 'action',
		label: 'label',
	},
};
