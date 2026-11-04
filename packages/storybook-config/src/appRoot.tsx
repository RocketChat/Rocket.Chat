import type { Decorator } from '@storybook/react';
import { Suspense } from 'react';

import TranslatedAppRoot, { type AppRootBuilder } from './TranslatedAppRoot.js';
import { readLanguageGlobal } from './language.js';

export type { AppRootBuilder };
export { languageGlobalTypes, languageInitialGlobals } from './language.js';

/**
 * Renders stories inside a mocked app root that speaks the language picked in the toolbar, with Rocket.Chat's real
 * translations; the story's own customizations apply last, so they win over the defaults.
 *
 * @param createRoot creates the builder, usually `mockAppRoot` from `@rocket.chat/mock-providers`
 * @param customize adds what the story needs, such as settings, endpoints or a user
 */
export const appRootDecorator = <TBuilder extends AppRootBuilder<TBuilder>>(
	createRoot: () => TBuilder,
	customize: (root: TBuilder) => TBuilder = (root) => root,
): Decorator => {
	const AppRootDecorator: Decorator = (Story, { globals }) => (
		<Suspense fallback={null}>
			<TranslatedAppRoot createRoot={createRoot} customize={customize} language={readLanguageGlobal(globals)}>
				<Story />
			</TranslatedAppRoot>
		</Suspense>
	);

	return AppRootDecorator;
};
