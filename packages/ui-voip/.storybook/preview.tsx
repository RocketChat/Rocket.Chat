import { mockAppRoot } from '@rocket.chat/mock-providers';
import { appRootDecorator, languageGlobalTypes, languageInitialGlobals } from '@rocket.chat/storybook-config/app-root';
import { parameters, decorators } from '@rocket.chat/storybook-config/preview';
import type { Preview } from '@storybook/react';

import DefaultBodySize from './DefaultBodySize';

const preview: Preview = {
	parameters: {
		...parameters,
	},
	decorators: [...decorators, DefaultBodySize, appRootDecorator(mockAppRoot)],
	globalTypes: languageGlobalTypes,
	initialGlobals: languageInitialGlobals,
};

export default preview;
