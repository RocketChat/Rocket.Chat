import { Box } from '@rocket.chat/fuselage';
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
					<Box height='100vh'>
						<Contextualbar>{fn()}</Contextualbar>
					</Box>
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
