import { mockAppRoot } from '@rocket.chat/mock-providers';
import { appRootDecorator, languageGlobalTypes, languageInitialGlobals } from '@rocket.chat/storybook-config/app-root';
import { parameters, decorators } from '@rocket.chat/storybook-config/preview';
import type { Preview } from '@storybook/react';

import { RocketChatDecorator } from './decorators';

import '../client/styles/main.css';
import 'highlight.js/styles/github.css';

const preview: Preview = {
	parameters: {
		...parameters,
	},
	decorators: [...decorators, RocketChatDecorator, appRootDecorator(mockAppRoot)],
	globalTypes: languageGlobalTypes,
	initialGlobals: languageInitialGlobals,
	tags: ['autodocs'],
};

export default preview;
