import { mockAppRoot } from '@rocket.chat/mock-providers';
import { appRootDecorator, languageGlobalTypes, languageInitialGlobals } from '@rocket.chat/storybook-config/app-root';
import { parameters as baseParameters, decorators as baseDecorators } from '@rocket.chat/storybook-config/preview';
import type { Preview } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import 'normalize.css/normalize.css';

const queryClient = new QueryClient();

const preview: Preview = {
	parameters: { ...baseParameters },
	decorators: [
		...baseDecorators,
		(fn) => <QueryClientProvider client={queryClient}>{fn()}</QueryClientProvider>,
		appRootDecorator(mockAppRoot),
	],
	globalTypes: languageGlobalTypes,
	initialGlobals: languageInitialGlobals,
	tags: ['autodocs'],
};

export default preview;
