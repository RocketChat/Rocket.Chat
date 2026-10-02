import hljs from 'highlight.js/lib/core';

import { languageAliases, languageDependencies, languageLoaders } from './highlightLanguages';

// Auto-detection candidates for blocks without a language.
const AUTO_DETECT_LANGUAGES = [
	'javascript',
	'css',
	'markdown',
	'dockerfile',
	'json',
	'go',
	'rust',
	'clean',
	'bash',
	'plaintext',
	'powershell',
	'scss',
	'shell',
	'yaml',
	'vim',
];

hljs.configure({ languages: AUTO_DETECT_LANGUAGES });

const pending = new Map<string, Promise<void>>();

const resolveLanguageName = (language: string) => {
	const name = language.toLowerCase();
	return languageAliases[name] ?? name;
};

const registerLanguage = (name: string): Promise<void> => {
	const loader = languageLoaders[name];
	if (!loader || hljs.getLanguage(name)) {
		return Promise.resolve();
	}

	let promise = pending.get(name);
	if (!promise) {
		promise = loader().then(async ({ default: language }) => {
			hljs.registerLanguage(name, language);
			await Promise.all((languageDependencies[name] ?? []).map(registerLanguage));
		});
		promise.catch(() => pending.delete(name));
		pending.set(name, promise);
	}
	return promise;
};

const getRequiredLanguages = (language: string | undefined) =>
	!language || language === 'none' ? AUTO_DETECT_LANGUAGES : [resolveLanguageName(language)];

/** Whether the languages a code block needs are already registered, so it can be highlighted synchronously. */
export const isHighlightReady = (language: string | undefined) =>
	getRequiredLanguages(language).every((name) => !languageLoaders[name] || hljs.getLanguage(name));

/** Registers the languages a code block needs; unknown languages resolve without registering anything. */
export const loadHighlightLanguages = async (language: string | undefined): Promise<void> => {
	await Promise.all(getRequiredLanguages(language).map(registerLanguage));
};

export default hljs;
