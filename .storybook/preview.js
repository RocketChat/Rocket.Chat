import { DocsPage, DocsContainer } from '@storybook/addon-docs/blocks';
import { addDecorator, addParameters } from '@storybook/react';

import { rocketChatDecorator } from './decorators';

addDecorator(rocketChatDecorator);

addParameters({
	docs: {
		container: DocsContainer,
		page: DocsPage,
	},
	grid: {
		cellSize: 4,
	},
	options: {
		storySort: {
			method: 'alphabetical',
		},
	},
});
