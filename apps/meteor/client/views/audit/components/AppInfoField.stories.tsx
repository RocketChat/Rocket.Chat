import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import { AppInfoField } from './AppInfoField';

export default {
	title: 'views/Audit/AppInfoField',
	component: AppInfoField,
	args: {
		appId: 'app-id',
	},
	decorators: [
		mockAppRoot()
			.withEndpoint(
				'GET',
				'/apps/:id',
				() =>
					({
						app: {
							name: 'App Name',
						},
					}) as any,
			)
			.withTranslations('en', 'core', { App_name: 'App Name' })
			.buildStoryDecorator(),
	],
} satisfies Meta<typeof AppInfoField>;

export const Default: StoryFn<typeof AppInfoField> = (args) => <AppInfoField {...args} />;

export const NoAppInfo: StoryFn<typeof AppInfoField> = (args) => <AppInfoField {...args} />;

NoAppInfo.decorators = [mockAppRoot().withTranslations('en', 'core', { App_id: 'App Id' }).buildStoryDecorator()];
