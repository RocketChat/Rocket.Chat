import { action } from '@storybook/addon-actions';
import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { loremIpsum } from '../../../.storybook/helpers';
import Modal from './component';

export default {
	title: 'Components/Modal',
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

export const Normal: Story<ComponentProps<typeof Modal>> = (args) => <Modal {...args} />;
Normal.storyName = 'normal';
Normal.args = {
	children: loremIpsum({ count: 1, units: 'paragraphs' }),
	open: true,
	animated: false,
	onDismiss: action('dismiss'),
};

export const Animated: Story<ComponentProps<typeof Modal>> = (args) => <Modal {...args} />;
Animated.storyName = 'animated';
Animated.args = {
	children: loremIpsum({ count: 1, units: 'paragraphs' }),
	open: true,
	animated: true,
	onDismiss: action('dismiss'),
};

export const Timeout: Story<ComponentProps<typeof Modal>> = (args) => <Modal {...args} />;
Timeout.storyName = 'timeout';
Timeout.args = {
	children: loremIpsum({ count: 1, units: 'paragraphs' }),
	open: true,
	animated: false,
	timeout: 3000,
	onDismiss: action('dismiss'),
};

export const DisallowDismissByOverlay: Story<ComponentProps<typeof Modal>> = (args) => <Modal {...args} />;
DisallowDismissByOverlay.storyName = 'disallow dismiss by overlay';
DisallowDismissByOverlay.args = {
	children: loremIpsum({ count: 1, units: 'paragraphs' }),
	open: true,
	animated: false,
	dismissByOverlay: false,
	onDismiss: action('dismiss'),
};

export const Confirm: Story<ComponentProps<typeof Modal.Confirm>> = (args) => <Modal.Confirm {...args} />;
Confirm.storyName = 'confirm';
Confirm.args = {
	text: 'Are you ok?',
	confirmButtonText: 'Yes',
	cancelButtonText: 'No',
	onConfirm: action('confirm'),
	onCancel: action('cancel'),
};

export const Alert: Story<ComponentProps<typeof Modal.Alert>> = (args) => <Modal.Alert {...args} />;
Alert.storyName = 'alert';
Alert.args = {
	text: 'You look great today.',
	buttonText: 'OK',
	onConfirm: action('confirm'),
};
