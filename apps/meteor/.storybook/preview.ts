import { parameters, decorators } from '@rocket.chat/storybook-config/preview';
import type { Preview } from '@storybook/react';

import { rocketChatDecorator } from './decorators';

const preview: Preview = {
	parameters: {
		...parameters,
	},
	decorators: [...decorators, rocketChatDecorator],
	tags: ['autodocs'],
};

export default preview;
