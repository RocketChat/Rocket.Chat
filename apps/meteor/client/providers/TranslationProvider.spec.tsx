import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, waitFor } from '@testing-library/react';

import TranslationProvider from './TranslationProvider';
import { i18n } from '../../app/utils/lib/i18n';

jest.mock('../apps/orchestrator', () => ({
	AppClientOrchestratorInstance: {
		getAppClientManager: () => ({ initialize: jest.fn() }),
		load: jest.fn(),
	},
}));

jest.mock('../lib/loggedIn', () => ({
	onLoggedIn: () => () => undefined,
}));

jest.mock('../lib/getURL', () => ({
	getURL: (path: string) => path,
}));

jest.mock('../lib/utils/setDateFnsLocale', () => ({
	setDateFnsLocale: jest.fn(),
}));

const appNamespace = 'app-without-translations';

const fetchMock = jest.fn(async (url: string) => ({
	text: async () => JSON.stringify({ Hello: `Hello from ${url}` }),
}));

beforeAll(() => {
	window.localStorage.setItem('fuselage-localStorage-userLanguage', JSON.stringify('pt-BR'));
	global.fetch = fetchMock as unknown as typeof fetch;
});

const renderProvider = async () => {
	render(<TranslationProvider>{null}</TranslationProvider>, { wrapper: mockAppRoot().build() });
	await waitFor(() => expect(i18n.hasResourceBundle('pt-BR', 'core')).toBe(true));
};

it('loads the core namespaces of the user language from its locale file', async () => {
	await renderProvider();

	expect(fetchMock).toHaveBeenCalledWith('i18n/pt-BR.json');
	expect(i18n.getResource('pt-BR', 'core', 'Hello')).toBe('Hello from i18n/pt-BR.json');
});

it('settles an app namespace once, without reading it from the locale files again', async () => {
	await renderProvider();

	await act(() => i18n.loadNamespaces(appNamespace));

	expect(i18n.languages.map((language) => i18n.hasResourceBundle(language, appNamespace))).toEqual([true, true, true]);

	const read = jest.spyOn(i18n.services.backendConnector, 'read');

	await act(() => i18n.loadNamespaces(appNamespace));

	expect(read).not.toHaveBeenCalled();
});
