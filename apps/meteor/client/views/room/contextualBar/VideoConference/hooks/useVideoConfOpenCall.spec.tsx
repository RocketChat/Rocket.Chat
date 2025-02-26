import { faker } from '@faker-js/faker';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { screen, act, renderHook } from '@testing-library/react';

import { useVideoConfOpenCall } from './useVideoConfOpenCall';

describe('with window.RocketChatDesktop set', () => {
	beforeEach(() => {
		window.RocketChatDesktop = {
			openInternalVideoChatWindow: jest.fn(),
		};
	});

	afterAll(() => {
		delete window.RocketChatDesktop;
	});

	it('should pass to videoConfOpenCall the url', async () => {
		const { result } = renderHook(() => useVideoConfOpenCall(), { wrapper: mockAppRoot().build() });

		const url = faker.internet.url();

		act(() => {
			result.current(url);
		});

		expect(window.RocketChatDesktop?.openInternalVideoChatWindow).toHaveBeenCalledWith(url, { providerName: undefined });
	});

	it('should pass to videoConfOpenCall the url and the providerName', async () => {
		const { result } = renderHook(() => useVideoConfOpenCall(), { wrapper: mockAppRoot().build() });

		const url = faker.internet.url();
		const providerName = faker.lorem.word();

		act(() => {
			result.current(url, providerName);
		});

		expect(window.RocketChatDesktop?.openInternalVideoChatWindow).toHaveBeenCalledWith(url, {
			providerName,
		});
	});
});

describe('without window.RocketChatDesktop set', () => {
	const previousWindowOpen = window.open;

	afterAll(() => {
		window.open = previousWindowOpen;
	});

	it('should open window', async () => {
		window.open = jest.fn(() => ({}) as Window);

		const { result } = renderHook(() => useVideoConfOpenCall(), {
			wrapper: mockAppRoot().build(),
		});

		const url = faker.internet.url();
		act(() => {
			result.current(url);
		});

		expect(window.open).toHaveBeenCalledWith(url);
		expect(screen.queryByRole('dialog', { name: 'Open_call_in_new_tab' })).not.toBeInTheDocument();
	});

	it('should NOT open window, AND open modal instead', async () => {
		window.open = jest.fn(() => null);

		const { result } = renderHook(() => useVideoConfOpenCall(), {
			wrapper: mockAppRoot().build(),
		});

		const url = faker.internet.url();
		act(() => {
			result.current(url);
		});

		expect(window.open).toHaveBeenCalledWith(url);
		expect(window.open).toHaveReturnedWith(null);
		expect(await screen.findByRole('dialog', { name: 'Open_call_in_new_tab' })).toBeInTheDocument();
	});
});
