import { DocsPage, DocsContainer } from '@storybook/addon-docs/blocks';
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
		storySort: ([, a], [, b]): number =>
			a.kind.localeCompare(b.kind),
	},
});
