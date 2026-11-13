import type { ComponentType, ReactNode } from 'react';
import { use, useLayoutEffect, useMemo } from 'react';

import { FALLBACK_LANGUAGE, isRightToLeft, loadTranslations } from './language.js';

/** The part of the mocked app root builder from `@rocket.chat/mock-providers` that the decorator drives. */
export type AppRootBuilder<TBuilder> = {
	withTranslations(language: string, namespace: string, resources: Record<string, string>): TBuilder;
	withDefaultLanguage(language: string): TBuilder;
	build(): ComponentType<{ children: ReactNode }>;
};

type TranslatedAppRootProps<TBuilder extends AppRootBuilder<TBuilder>> = {
	createRoot: () => TBuilder;
	customize: (root: TBuilder) => TBuilder;
	language: string;
	children: ReactNode;
};

/** Mounts a mocked app root speaking a language with Rocket.Chat's real translations, then the caller's customizations. */
const TranslatedAppRoot = <TBuilder extends AppRootBuilder<TBuilder>>({
	createRoot,
	customize,
	language,
	children,
}: TranslatedAppRootProps<TBuilder>) => {
	const fallbackTranslations = use(loadTranslations(FALLBACK_LANGUAGE));
	const translations = use(loadTranslations(language));

	const Root = useMemo(() => {
		let root = createRoot();

		for (const [lng, namespaces] of [
			[FALLBACK_LANGUAGE, fallbackTranslations],
			[language, translations],
		] as const) {
			for (const [namespace, resources] of Object.entries(namespaces)) {
				root = root.withTranslations(lng, namespace, resources);
			}
		}

		return customize(root.withDefaultLanguage(language)).build();
	}, [createRoot, customize, fallbackTranslations, language, translations]);

	useLayoutEffect(() => {
		const { documentElement } = document;
		const previous = documentElement.dir;
		documentElement.dir = isRightToLeft(language) ? 'rtl' : 'ltr';

		return () => {
			documentElement.dir = previous;
		};
	}, [language]);

	return <Root>{children}</Root>;
};

export default TranslatedAppRoot;
