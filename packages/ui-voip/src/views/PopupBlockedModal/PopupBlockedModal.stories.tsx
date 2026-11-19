import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import PopupBlockedModal from './PopupBlockedModal';

const noop = () => undefined;

const meta = {
	title: 'Components/PopupBlockedModal',
	component: PopupBlockedModal,
	decorators: [
		mockAppRoot()
			.withSetting('Site_Url', 'https://your.rocket.chat')
			.withTranslations('en', 'core', {
				Open_call_in_new_tab: 'Open call in new tab',
				Open_call: 'Open call',
				Your_web_browser_blocked_Rocket_Chat_from_opening_tab: 'Your web browser blocked Rocket.Chat from opening a new tab.',
				To_prevent_seeing_this_message_again_allow_popups_from_workspace_URL: 'To prevent seeing this message again, allow popups from ',
			})
			.buildStoryDecorator(),
		(Story) => <Story />,
	],
} satisfies Meta<typeof PopupBlockedModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		onClose: noop,
		onConfirm: noop,
	},
};
