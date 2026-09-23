import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, waitFor } from '@testing-library/react';

import TranslationProvider from './TranslationProvider';
import { i18n } from '../../lib/i18n';

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

beforeAll(() => {
	// English is bundled, so the session starts without fetching a locale file
	window.localStorage.setItem('fuselage-localStorage-userLanguage', JSON.stringify('en'));
	global.fetch = jest.fn(async () => ({
		text: async () => JSON.stringify({ Encrypted_RoomType: '{{roomType, capitalize}} criptografado' }),
	})) as unknown as typeof fetch;
});

it('applies the capitalize formatter in a session that starts in English', async () => {
	render(<TranslationProvider>{null}</TranslationProvider>, { wrapper: mockAppRoot().build() });
	await waitFor(() => expect(i18n.isInitialized).toBe(true));

	await act(() => i18n.changeLanguage('pt-BR'));

	expect(i18n.t('Encrypted_RoomType', { roomType: 'canal' })).toBe('Canal criptografado');
});
