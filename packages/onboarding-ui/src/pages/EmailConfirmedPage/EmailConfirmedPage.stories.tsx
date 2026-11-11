import type { StoryFn, Meta } from '@storybook/react-webpack5';

import EmailConfirmedPage from './EmailConfirmedPage';

export default {
	title: 'pages/EmailConfirmedPage',
	component: EmailConfirmedPage,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof EmailConfirmedPage>;

export const _EmailConfirmedPage: StoryFn<typeof EmailConfirmedPage> = () => <EmailConfirmedPage />;
_EmailConfirmedPage.storyName = 'EmailConfirmedPage';
