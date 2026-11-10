import type { Meta, StoryFn } from '@storybook/react-webpack5';

import TotpForm from './TotpForm';

export default {
	title: 'forms/TotpForm',
	component: TotpForm,
	parameters: {
		layout: 'centered',
		actions: { argTypesRegex: '^on.*' },
	},
} satisfies Meta<typeof TotpForm>;

export const _TotpForm: StoryFn<typeof TotpForm> = (args) => <TotpForm {...args} />;
_TotpForm.storyName = 'TotpForm';
