import type { Meta, StoryFn } from '@storybook/react-webpack5';

import RegisterOfflineForm from './RegisterOfflineForm';

export default {
	title: 'forms/RegisterOfflineForm',
	component: RegisterOfflineForm,
	parameters: {
		layout: 'centered',
		actions: { argTypesRegex: '^on.*' },
	},
	args: {
		clientKey:
			'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
	},
} satisfies Meta<typeof RegisterOfflineForm>;

export const _RegisterOfflineForm: StoryFn<typeof RegisterOfflineForm> = (args) => <RegisterOfflineForm {...args} />;
