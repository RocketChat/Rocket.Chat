import { mockAppRoot } from '@rocket.chat/mock-providers';
import { type ComponentMeta } from '@storybook/react';

import ResetPasswordPage from './ResetPasswordPage';

export default {
	title: 'Login/ResetPassword',
	component: ResetPasswordPage,
	decorators: [mockAppRoot().buildStoryDecorator()],
} satisfies ComponentMeta<typeof ResetPasswordPage>;

export const Basic = () => <ResetPasswordPage />;
