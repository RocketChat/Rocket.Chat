import { parameters, decorators } from '@rocket.chat/storybook-config/preview';
import type { Preview } from '@storybook/react';

import { RocketChatDecorator } from './decorators';

import '../app/theme/client/main.css';
import 'highlight.js/styles/github.css';

const preview: Preview = {
	parameters: {
		...parameters,
	},
	decorators: [...decorators, RocketChatDecorator],
	tags: ['autodocs'],
};

export default preview;
