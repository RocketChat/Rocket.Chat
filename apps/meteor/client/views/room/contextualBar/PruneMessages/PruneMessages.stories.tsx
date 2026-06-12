import { Contextualbar } from '@rocket.chat/ui-client';
import type { Meta } from '@storybook/react';
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

export const Default = {};

export const WithCallout = {
	args: {
		callOutText: 'This is a callout',
	},
};
