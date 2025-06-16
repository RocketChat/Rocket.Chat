import type { Decorator, Parameters } from '@storybook/react';

import '../../../../apps/meteor/app/theme/client/main.css';
import 'highlight.js/styles/github.css';

export const parameters: Parameters = {
	controls: {
		matchers: {
			color: /(background|color)$/i,
			date: /Date$/,
		},
	},
};

export const decorators: Decorator[] = [
	// eslint-disable-next-line @typescript-eslint/naming-convention
	(Story) => (
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
