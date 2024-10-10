import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { DecoratorFn, Parameters } from '@storybook/react';

import { rocketChatDecorator } from './decorators';

export const decorators: DecoratorFn[] = [mockAppRoot().withRealTranslations().buildStoryDecorator(), rocketChatDecorator];

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
