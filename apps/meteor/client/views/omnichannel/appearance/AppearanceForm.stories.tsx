import type { StoryObj, Meta } from '@storybook/react';

import AppearanceForm from './AppearanceForm';

export default {
	component: AppearanceForm,
} satisfies Meta<typeof AppearanceForm>;

export const Default: StoryObj<typeof AppearanceForm> = {
	render: () => <AppearanceForm />,
	name: 'AppearanceForm',
};
