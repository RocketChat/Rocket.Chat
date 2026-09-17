import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';
import { action } from 'storybook/actions';

import EnterE2EPasswordModal from '.';

export default {
	component: EnterE2EPasswordModal,
	decorators: [mockAppRoot().withTranslations('en', 'core', {}).buildStoryDecorator()],
} satisfies Meta<typeof EnterE2EPasswordModal>;

export const Default: StoryFn<typeof EnterE2EPasswordModal> = () => (
	<EnterE2EPasswordModal onConfirm={action('submit')} onClose={action('close')} onCancel={action('cancel')} />
);
