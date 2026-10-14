import { after, before, describe, it, mock } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, waitFor } from '@testing-library/react';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../tests/mocks/moduleScope';

let TranslationProvider: (typeof import('./TranslationProvider'))['default'];
let i18n: (typeof import('../../app/utils/lib/i18n'))['i18n'];
describe('TranslationProvider.formatters', () => {
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
		// English is bundled, so the session starts without fetching a locale file
		window.localStorage.setItem('fuselage-localStorage-userLanguage', JSON.stringify('en'));
		global.fetch = fn<FunctionLike>(async () => ({
			text: async () => JSON.stringify({ Encrypted_RoomType: '{{roomType, capitalize}} criptografado' }),
		})) as unknown as typeof fetch;
	});

	it('applies the capitalize formatter in a session that starts in English', async () => {
		render(<TranslationProvider>{null}</TranslationProvider>, { wrapper: mockAppRoot().build() });
		await waitFor(() => expect(i18n.isInitialized).toBe(true));

		await act(() => i18n.changeLanguage('pt-BR'));

		expect(i18n.t('Encrypted_RoomType', { roomType: 'canal' })).toBe('Canal criptografado');
	});
});
