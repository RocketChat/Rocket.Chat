import { mockAppRoot } from '@rocket.chat/mock-providers';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';

import EnterE2EPasswordModal from '.';

export default {
	title: 'views/EnterE2EPasswordModal',
	component: EnterE2EPasswordModal,
	decorators: [mockAppRoot().withTranslations('en', 'core', {}).buildStoryDecorator()],
} satisfies Meta<typeof EnterE2EPasswordModal>;

export const Default: StoryFn<typeof EnterE2EPasswordModal> = () => (
	<EnterE2EPasswordModal onConfirm={action('submit')} onClose={action('close')} onCancel={action('cancel')} />
);
