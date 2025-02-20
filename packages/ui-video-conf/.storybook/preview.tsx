import type { Decorator } from '@storybook/react';
import type { ReactElement } from 'react';

import '../../../apps/meteor/app/theme/client/main.css';
import 'highlight.js/styles/github.css';
import '@rocket.chat/icons/dist/rocketchat.css';

export const parameters = {
	controls: {
		matchers: {
			color: /(background|color)$/i,
			date: /Date$/,
		},
	},
};

export const decorators: Decorator[] = [
	(Story): ReactElement => (
		<div>
			<style>{`
				body {
					background-color: white;
				}
			`}</style>
			<Story />
		</div>
	),
];
export const tags = ['autodocs'];
