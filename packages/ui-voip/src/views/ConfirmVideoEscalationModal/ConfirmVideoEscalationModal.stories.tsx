import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import ConfirmVideoEscalationModal from './ConfirmVideoEscalationModal';

const noop = () => undefined;

const meta = {
	title: 'Components/ConfirmVideoEscalationModal',
	component: ConfirmVideoEscalationModal,
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				Video_escalation_modal_title: 'Start a video call?',
				Video_escalation_modal_description:
					'This will escalate the current voice call to a video call. The other participant will be notified.',
				Start_video_call: 'Start video call',
				Cancel: 'Cancel',
			})
			.buildStoryDecorator(),
		(Story) => <Story />,
	],
} satisfies Meta<typeof ConfirmVideoEscalationModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		onCancel: noop,
		onConfirm: noop,
	},
};
