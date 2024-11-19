import { Decorator, Parameters } from '@storybook/react';
import '../../../apps/meteor/app/theme/client/main.css';
import 'highlight.js/styles/github.css';
import { ReactElement } from 'react';

export const parameters: Parameters = {
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
