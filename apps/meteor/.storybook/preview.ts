import { DocsPage, DocsContainer } from '@storybook/addon-docs';
import { addDecorator, addParameters } from '@storybook/react';

import { rocketChatDecorator } from './decorators';

addDecorator(rocketChatDecorator);

addParameters({
	backgrounds: {
		grid: {
			cellSize: 4,
			cellAmount: 4,
			opacity: 0.5,
		},
	},
	docs: {
		container: DocsContainer,
		page: DocsPage,
	},
	options: {
		storySort: {
			method: 'alphabetical',
			order: ['Components', '*', 'Enterprise'],
		},
	},
});
