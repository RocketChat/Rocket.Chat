import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import BackupCodesModal from './BackupCodesModal';

export default {
	component: BackupCodesModal,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(Story) => {
			const AppRoot = mockAppRoot().build();
			return (
				<AppRoot>
					<Story />
				</AppRoot>
			);
		},
	],
	args: {
		codes: [
			'1a2b3c4d',
			'5e6f7g8h',
			'9i0j1k2l',
			'3m4n5o6p',
			'7q8r9s0t',
			'1u2v3w4x',
			'5y6z7a8b',
			'9c0d1e2f',
			'3g4h5i6j',
			'7k8l9m0n',
			'1o2p3q4r',
			'5s6t7u8v',
		],
		onClose: action('onClose'),
	},
} satisfies Meta<typeof BackupCodesModal>;

type Story = StoryObj<typeof BackupCodesModal>;

export const Default: Story = {};
