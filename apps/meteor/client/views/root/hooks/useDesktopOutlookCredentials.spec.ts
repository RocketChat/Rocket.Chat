import type { IUser } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { useDesktopOutlookCredentials } from './useDesktopOutlookCredentials';
import { STORAGE_KEYS, setStoredItem } from '../../../lib/sdk/storage';

let mockUser: Partial<IUser> | undefined;

jest.mock('@rocket.chat/ui-contexts', () => {
	const actual = jest.requireActual('@rocket.chat/ui-contexts');
	return { ...actual, useUser: () => mockUser ?? actual.useUser() };
});

const setUserToken = jest.fn();
const setOutlookExchangeUrl = jest.fn();

const outlookUser = (outlook?: { Enabled: boolean; Exchange_Url: string; Outlook_Url: string }) => ({
	settings: outlook ? { calendar: { outlook } } : {},
});

const enabled = { Enabled: true, Exchange_Url: 'https://mail.example.com/', Outlook_Url: 'https://mail.example.com/owa/' };

describe('useDesktopOutlookCredentials', () => {
	beforeEach(() => {
		Object.assign(window, { RocketChatDesktop: { setUserToken, setOutlookExchangeUrl } });
		localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, 'a-login-token');
	});

	afterEach(() => {
		delete (window as { RocketChatDesktop?: unknown }).RocketChatDesktop;
		localStorage.clear();
		mockUser = undefined;
		setUserToken.mockClear();
		setOutlookExchangeUrl.mockClear();
	});

	it('should push the login token and the Exchange URL when the Outlook calendar is on', () => {
		renderHook(() => useDesktopOutlookCredentials(), {
			wrapper: mockAppRoot().withJohnDoe(outlookUser(enabled)).build(),
		});

		expect(setUserToken).toHaveBeenCalledTimes(1);
		expect(setUserToken).toHaveBeenCalledWith('a-login-token', 'john.doe');
		expect(setOutlookExchangeUrl).toHaveBeenCalledTimes(1);
		expect(setOutlookExchangeUrl).toHaveBeenCalledWith('https://mail.example.com/', 'john.doe');
	});

	it('should push the Exchange URL before the login token', () => {
		renderHook(() => useDesktopOutlookCredentials(), {
			wrapper: mockAppRoot().withJohnDoe(outlookUser(enabled)).build(),
		});

		expect(setOutlookExchangeUrl.mock.invocationCallOrder[0]).toBeLessThan(setUserToken.mock.invocationCallOrder[0]);
	});

	it('should push again when the login token changes', () => {
		renderHook(() => useDesktopOutlookCredentials(), {
			wrapper: mockAppRoot().withJohnDoe(outlookUser(enabled)).build(),
		});

		act(() => {
			setStoredItem(STORAGE_KEYS.LOGIN_TOKEN, 'a-fresh-token');
		});

		expect(setUserToken).toHaveBeenLastCalledWith('a-fresh-token', 'john.doe');
	});

	it('should push again, URL first, when the user changes', () => {
		mockUser = { _id: 'user-a', ...outlookUser(enabled) };
		const { rerender } = renderHook(() => useDesktopOutlookCredentials(), { wrapper: mockAppRoot().build() });

		mockUser = { _id: 'user-b', ...outlookUser(enabled) };
		rerender();

		expect(setOutlookExchangeUrl).toHaveBeenLastCalledWith('https://mail.example.com/', 'user-b');
		expect(setUserToken).toHaveBeenLastCalledWith('a-login-token', 'user-b');
		expect(setOutlookExchangeUrl.mock.invocationCallOrder[1]).toBeLessThan(setUserToken.mock.invocationCallOrder[1]);
	});

	it('should push again when the Exchange URL changes', () => {
		mockUser = { _id: 'user-a', ...outlookUser(enabled) };
		const { rerender } = renderHook(() => useDesktopOutlookCredentials(), { wrapper: mockAppRoot().build() });

		mockUser = { _id: 'user-a', ...outlookUser({ ...enabled, Exchange_Url: 'https://exchange.example.org/' }) };
		rerender();

		expect(setOutlookExchangeUrl).toHaveBeenCalledTimes(2);
		expect(setOutlookExchangeUrl).toHaveBeenLastCalledWith('https://exchange.example.org/', 'user-a');
	});

	it('should not push again when a new user object carries the same values', () => {
		mockUser = { _id: 'user-a', ...outlookUser(enabled) };
		const { rerender } = renderHook(() => useDesktopOutlookCredentials(), { wrapper: mockAppRoot().build() });

		mockUser = { _id: 'user-a', ...outlookUser({ ...enabled }) };
		rerender();

		expect(setUserToken).toHaveBeenCalledTimes(1);
	});

	it('should push nothing when the Outlook calendar is off', () => {
		renderHook(() => useDesktopOutlookCredentials(), {
			wrapper: mockAppRoot()
				.withJohnDoe(outlookUser({ ...enabled, Enabled: false }))
				.build(),
		});

		expect(setUserToken).not.toHaveBeenCalled();
		expect(setOutlookExchangeUrl).not.toHaveBeenCalled();
	});

	it('should push nothing when no Exchange URL is set', () => {
		renderHook(() => useDesktopOutlookCredentials(), {
			wrapper: mockAppRoot()
				.withJohnDoe(outlookUser({ ...enabled, Exchange_Url: '' }))
				.build(),
		});

		expect(setUserToken).not.toHaveBeenCalled();
		expect(setOutlookExchangeUrl).not.toHaveBeenCalled();
	});

	it('should push nothing when the user has no calendar settings', () => {
		renderHook(() => useDesktopOutlookCredentials(), {
			wrapper: mockAppRoot().withJohnDoe(outlookUser()).build(),
		});

		expect(setUserToken).not.toHaveBeenCalled();
	});

	it('should push nothing when no login token is stored', () => {
		localStorage.removeItem(STORAGE_KEYS.LOGIN_TOKEN);

		renderHook(() => useDesktopOutlookCredentials(), {
			wrapper: mockAppRoot().withJohnDoe(outlookUser(enabled)).build(),
		});

		expect(setUserToken).not.toHaveBeenCalled();
	});

	it('should not throw on a desktop app without the Outlook members', () => {
		Object.assign(window, { RocketChatDesktop: {} });

		expect(() =>
			renderHook(() => useDesktopOutlookCredentials(), {
				wrapper: mockAppRoot().withJohnDoe(outlookUser(enabled)).build(),
			}),
		).not.toThrow();
	});
});
