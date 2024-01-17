import { DecoratorFn, Parameters } from '@storybook/react';

import { rocketChatDecorator } from './decorators';

export const decorators: DecoratorFn[] = [
	rocketChatDecorator
];

export const parameters: Parameters = {
	backgrounds: {
		grid: {
			cellSize: 4,
			cellAmount: 4,
			opacity: 0.5,
		},
	},
	options: {
		storySort: {
			method: 'alphabetical',
			order: ['Components', '*', 'Enterprise'],
		},
	},
};
