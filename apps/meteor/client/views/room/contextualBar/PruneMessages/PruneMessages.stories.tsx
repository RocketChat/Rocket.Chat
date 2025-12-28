import { Contextualbar } from '@rocket.chat/ui-client';
import type { Meta, StoryFn } from '@storybook/react';
import { FormProvider, useForm } from 'react-hook-form';

import PruneMessages from './PruneMessages';

export default {
	component: PruneMessages,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [
		(fn) => {
			const methods = useForm({
				defaultValues: {
					pinned: true,
				},
			});

			return (
				<FormProvider {...methods}>
					<Contextualbar height='100vh'>{fn()}</Contextualbar>
				</FormProvider>
			);
		},
	],
} satisfies Meta<typeof PruneMessages>;

const Template: StoryFn<typeof PruneMessages> = (args) => <PruneMessages {...args} />;

export const Default = Template.bind({});

export const WithCallout = Template.bind({});
WithCallout.args = {
	callOutText: 'This is a callout',
};
