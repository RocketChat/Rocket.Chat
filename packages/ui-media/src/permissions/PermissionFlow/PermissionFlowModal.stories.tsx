import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import PermissionFlowModal from './PermissionFlowModal';

const noop = () => undefined;

const meta = {
	component: PermissionFlowModal,
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				VoIP_device_permission_required: 'Mic/speaker access required',
				VoIP_allow_and_call: 'Allow and call',
				VoIP_allow_and_accept: 'Allow and accept',
				Continue_without_mic: 'Continue without mic',
				Call_without_mic: 'Call without mic',
				Accept_without_mic: 'Accept without mic',
				Cancel: 'Cancel',
				VoIP_device_permission_required_description:
					'Your web browser stopped {{workspaceUrl}} from using your microphone and/or speaker.\n\nAllow speaker and microphone access in your browser settings to prevent seeing this message again.',
				VoIP_devices_not_found: 'Microphone not detected',
				VoIP_devices_not_found_description:
					'Your web browser did not list any eligible audio input for this call. Ensure you have at least one audio input connected to your device and enabled in the system settings.',
			})
			.buildStoryDecorator(),
		(Story) => <Story />,
	],
} satisfies Meta<typeof PermissionFlowModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PermissionFlowModalOutgoingPrompt: Story = {
	args: {
		onCancel: noop,
		onConfirm: noop,
		type: 'outgoingPrompt',
	},
	name: 'Outgoing call, permission in prompt state',
};

export const PermissionFlowModalIncomingPrompt: Story = {
	args: {
		onCancel: noop,
		onConfirm: noop,
		type: 'incomingPrompt',
	},
	name: 'Incoming call, permission in prompt state',
};

export const PermissionFlowModalDeviceChangePrompt: Story = {
	args: {
		onCancel: noop,
		onConfirm: noop,
		type: 'deviceChangePrompt',
	},
	name: 'Device change, permission in prompt state',
};

export const PermissionFlowModalDenied: Story = {
	args: {
		onCancel: noop,
		onConfirm: noop,
		type: 'denied',
	},
	name: 'Permission denied',
};

export const PermissionFlowModalNoDevices: Story = {
	args: {
		onCancel: noop,
		onConfirm: noop,
		type: 'noDevices',
	},
	name: 'No devices found',
};
