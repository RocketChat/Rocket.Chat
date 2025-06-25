import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta } from '@storybook/react';

import LoginForm from './LoginForm';

export default {
	title: 'views/LoginForm',
	component: LoginForm,
	decorators: [mockAppRoot().buildStoryDecorator()],
} satisfies Meta<typeof LoginForm>;

export const Default = () => <LoginForm setLoginRoute={() => undefined} />;
