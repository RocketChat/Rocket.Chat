import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta } from '@storybook/react';

import ResetPasswordPage from './ResetPasswordPage';

export default {
	title: 'Login/ResetPassword',
	component: ResetPasswordPage,
	decorators: [mockAppRoot().buildStoryDecorator()],
} satisfies Meta<typeof ResetPasswordPage>;

export const Basic = () => <ResetPasswordPage />;
