import type { StoryFn, Meta } from '@storybook/react-webpack5';

import ConfirmationProcessPage from './ConfirmationProcessPage';

export default {
	title: 'pages/ConfirmationProcessPage',
	component: ConfirmationProcessPage,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof ConfirmationProcessPage>;

export const _ConfirmationProcessPage: StoryFn<typeof ConfirmationProcessPage> = () => <ConfirmationProcessPage />;
_ConfirmationProcessPage.storyName = 'ConfirmationProcessPage';
