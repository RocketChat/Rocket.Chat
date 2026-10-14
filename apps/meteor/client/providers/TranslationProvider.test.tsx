import { after, before, describe, it, mock } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, waitFor } from '@testing-library/react';
import { expect } from 'expect';
import { fn, spyOn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../tests/mocks/moduleScope';

let TranslationProvider: (typeof import('./TranslationProvider'))['default'];
let i18n: (typeof import('../../app/utils/lib/i18n'))['i18n'];

const appNamespace = 'app-without-translations';

const fetchMock = fn<FunctionLike>(async (url: string) => ({
	text: async () => JSON.stringify({ Hello: `Hello from ${url}` }),
}));

const renderProvider = async () => {
	render(<TranslationProvider>{null}</TranslationProvider>, { wrapper: mockAppRoot().build() });
	await waitFor(() => expect(i18n.hasResourceBundle('pt-BR', 'core')).toBe(true));
};

describe('TranslationProvider', () => {
	before(() => {
		enterModuleScope();
		mock.module('../apps/orchestrator', {
			exports: {
				AppClientOrchestratorInstance: {
					getAppClientManager: () => ({ initialize: fn<FunctionLike>() }),
					load: fn<FunctionLike>(),
				},
			},
		});
		mock.module('../lib/loggedIn', {
			exports: {
				onLoggedIn: () => () => undefined,
			},
		});
		mock.module('../lib/getURL', {
			exports: {
				getURL: (path: string) => path,
			},
		});
		mock.module('../lib/utils/setDateFnsLocale', {
			exports: {
				setDateFnsLocale: fn<FunctionLike>(),
			},
		});
		({ default: TranslationProvider } = require('./TranslationProvider'));
		({ i18n } = require('../../app/utils/lib/i18n'));
	});

	after(leaveModuleScope);

	before(() => {
		window.localStorage.setItem('fuselage-localStorage-userLanguage', JSON.stringify('pt-BR'));
		global.fetch = fetchMock as unknown as typeof fetch;
	});

	it('loads the core namespaces of the user language from its locale file', async () => {
		await renderProvider();

		expect(fetchMock).toHaveBeenCalledWith('i18n/pt-BR.json');
		expect(i18n.getResource('pt-BR', 'core', 'Hello')).toBe('Hello from i18n/pt-BR.json');
	});

	it('settles an app namespace once, without reading it from the locale files again', async () => {
		await renderProvider();

		await act(() => i18n.loadNamespaces(appNamespace));

		expect(i18n.languages.map((language) => i18n.hasResourceBundle(language, appNamespace))).toEqual([true, true, true]);

		const read = spyOn(i18n.services.backendConnector, 'read');

		await act(() => i18n.loadNamespaces(appNamespace));

		expect(read).not.toHaveBeenCalled();
	});
});
