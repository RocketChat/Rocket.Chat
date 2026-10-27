import { Box } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { StoryObj, Meta } from '@storybook/react';
import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import BusinessHoursForm from './BusinessHoursForm';
import type { BusinessHoursFormData } from './BusinessHoursForm';
import { defaultWorkHours } from './mapBusinessHoursForm';

const BusinessHoursFormProvider = ({ children }: { children: ReactNode }) => {
	const daysTime = defaultWorkHours();
	const methods = useForm<BusinessHoursFormData>({
		defaultValues: {
			timezoneName: 'America/Sao_Paulo',
			daysOpen: daysTime.filter(({ open }) => open).map(({ day }) => day),
			daysTime: daysTime.filter(({ open }) => open),
		},
	});
	return <FormProvider {...methods}>{children}</FormProvider>;
};

export default {
	component: BusinessHoursForm,
	decorators: [
		(fn) => {
			const AppRoot = mockAppRoot().build();
			return (
				<AppRoot>
					<BusinessHoursFormProvider>
						<Box maxWidth='x600' alignSelf='center' width='full' margin='x24'>
							{fn()}
						</Box>
					</BusinessHoursFormProvider>
				</AppRoot>
			);
		},
	],
} satisfies Meta<typeof BusinessHoursForm>;

export const Default: StoryObj<typeof BusinessHoursForm> = {
	name: 'BusinessHoursForm',
};
