import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useDesktopFavicon } from './useDesktopFavicon';
import { useDesktopTitle } from './useDesktopTitle';
import { useDesktopUserRoles } from './useDesktopUserRoles';

// Desktop 4.18 throws from `setTitle` while its preload does not know the server URL yet.
const desktopError = new TypeError('Failed to construct URL: Invalid URL');
const throwing = () => {
	throw desktopError;
};

const wrapper = () =>
	mockAppRoot()
		.withSetting('Site_Name', 'Rocket.Chat')
		.withSetting('Assets_favicon', { defaultUrl: 'favicon.svg' })
		.withJohnDoe({ roles: ['user'] })
		.build();

const hooks = [
	['useDesktopTitle', 'setTitle', useDesktopTitle, 'Rocket.Chat'],
	['useDesktopFavicon', 'setUrlResolver', useDesktopFavicon, expect.any(Function)],
	['useDesktopFavicon', 'setFavicon', useDesktopFavicon, expect.stringMatching(/favicon\.svg$/)],
	['useDesktopUserRoles', 'setUserRoles', useDesktopUserRoles, ['user']],
] as const;

describe('desktop bridge hooks', () => {
	let warn: jest.SpyInstance;

	beforeEach(() => {
		warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
	});

	afterEach(() => {
		delete (window as { RocketChatDesktop?: unknown }).RocketChatDesktop;
		warn.mockRestore();
	});

	it.each(hooks)('%s should call %s on the desktop bridge', (_name, member, useHook, argument) => {
		const call = jest.fn();
		Object.assign(window, { RocketChatDesktop: { setTitle: jest.fn(), setUrlResolver: jest.fn(), setFavicon: jest.fn(), [member]: call } });

		renderHook(() => useHook(), { wrapper: wrapper() });

		expect(call).toHaveBeenCalledTimes(1);
		expect(call).toHaveBeenCalledWith(argument);
	});

	it.each(hooks)('%s should not crash the React tree when %s throws', (_name, member, useHook) => {
		Object.assign(window, {
			RocketChatDesktop: { setTitle: jest.fn(), setUrlResolver: jest.fn(), setFavicon: jest.fn(), [member]: jest.fn(throwing) },
		});

		expect(() => renderHook(() => useHook(), { wrapper: wrapper() })).not.toThrow();
		expect(warn).toHaveBeenCalledWith(expect.any(String), desktopError);
	});

	it.each(hooks)('%s should do nothing outside the desktop app (%s)', (_name, _member, useHook) => {
		expect(() => renderHook(() => useHook(), { wrapper: wrapper() })).not.toThrow();
		expect(warn).not.toHaveBeenCalled();
	});
});
