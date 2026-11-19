import { Box } from '@rocket.chat/fuselage';
import { Contextualbar } from '@rocket.chat/ui-client';
import type { Meta } from '@storybook/react';
import { FormProvider, useForm } from 'react-hook-form';

import PruneMessages from './PruneMessages';
import { initialValues } from './PruneMessagesWithData';

export default {
	component: PruneMessages,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [
		(fn) => {
			const methods = useForm({
				defaultValues: initialValues,
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

export const Default = {
	args: {
		validateDateRange: () => true,
	},
};
