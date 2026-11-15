import type { Meta, StoryObj } from '@storybook/preact';
import type { ComponentProps } from 'preact';
import { action } from 'storybook/actions';

import AlertModal from './AlertModal';
import ConfirmationModal from './ConfirmationModal';
import Modal from './Modal';
import { loremIpsum } from '../../../.storybook/helpers';

export default {
	decorators: [
		(storyFn) => (
			<div>
				<div style={{ padding: '5rem' }}>
					{loremIpsum({ count: 5, units: 'paragraphs' })
						.split('\n')
						.map((paragraph, i) => (
							<p key={i}>{paragraph}</p>
						))}
				</div>
				{storyFn()}
			</div>
		),
	],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta;

export const Normal: StoryObj<ComponentProps<typeof Modal>> = {
	name: 'normal',
	args: {
		children: loremIpsum({ count: 1, units: 'paragraphs' }),
		open: true,
		animated: false,
		onDismiss: action('dismiss'),
	},
	render: (args) => <Modal {...args} />,
};

export const Animated: StoryObj<ComponentProps<typeof Modal>> = {
	name: 'animated',
	args: {
		children: loremIpsum({ count: 1, units: 'paragraphs' }),
		open: true,
		animated: true,
		onDismiss: action('dismiss'),
	},
	render: (args) => <Modal {...args} />,
};

export const Timeout: StoryObj<ComponentProps<typeof Modal>> = {
	name: 'timeout',
	args: {
		children: loremIpsum({ count: 1, units: 'paragraphs' }),
		open: true,
		animated: false,
		timeout: 3000,
		onDismiss: action('dismiss'),
	},
	render: (args) => <Modal {...args} />,
};

export const DisallowDismissByOverlay: StoryObj<ComponentProps<typeof Modal>> = {
	name: 'disallow dismiss by overlay',
	args: {
		children: loremIpsum({ count: 1, units: 'paragraphs' }),
		open: true,
		animated: false,
		dismissByOverlay: false,
		onDismiss: action('dismiss'),
	},
	render: (args) => <Modal {...args} />,
};

export const Confirm: StoryObj<ComponentProps<typeof ConfirmationModal>> = {
	name: 'confirm',
	args: {
		text: 'Are you ok?',
		confirmButtonText: 'Yes',
		cancelButtonText: 'No',
		onConfirm: action('confirm'),
		onCancel: action('cancel'),
	},
	render: (args) => <ConfirmationModal {...args} />,
};

export const Alert: StoryObj<ComponentProps<typeof AlertModal>> = {
	name: 'alert',
	args: {
		text: 'You look great today.',
		buttonText: 'OK',
		onConfirm: action('confirm'),
	},
	render: (args) => <AlertModal {...args} />,
};
