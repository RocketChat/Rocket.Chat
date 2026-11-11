import type { StoryFn, Meta } from '@storybook/react-webpack5';
import { action } from 'storybook/actions';

import CheckYourEmailPage from './CheckYourEmailPage';

export default {
	title: 'pages/CheckYourEmailPage',
	component: CheckYourEmailPage,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'fullscreen',
	},
	args: {
		title: '',
		children: '',
		onResendEmailRequest: action('onResendEmailRequest'),
		onChangeEmailRequest: action('onChangeEmailRequest'),
	},
} satisfies Meta<typeof CheckYourEmailPage>;

export const _CheckYourEmailPage: StoryFn<typeof CheckYourEmailPage> = (args) => <CheckYourEmailPage {...args} />;
_CheckYourEmailPage.storyName = 'CheckYourEmailPage';
