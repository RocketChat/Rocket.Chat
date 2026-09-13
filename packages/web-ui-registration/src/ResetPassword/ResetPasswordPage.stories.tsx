import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import ResetPasswordPage from './ResetPasswordPage.js';

export default {
	component: ResetPasswordPage,
	decorators: [mockAppRoot().buildStoryDecorator()],
} satisfies Meta<typeof ResetPasswordPage>;

export const Basic: StoryObj<typeof ResetPasswordPage> = {};
