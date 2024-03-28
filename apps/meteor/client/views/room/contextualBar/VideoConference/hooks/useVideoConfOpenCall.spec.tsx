import { faker } from '@faker-js/faker';
import { ModalContext } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { useVideoConfOpenCall } from './useVideoConfOpenCall';

describe('with window.RocketChatDesktop set', () => {
	const wrapper: React.FC = ({ children }) => (
		<ModalContext.Provider
			children={children}
			value={{
				modal: {
					setModal: () => {
						return null;
					},
				},
				currentModal: { component: null },
			}}
		/>
	);
	beforeEach(() => {
		window.RocketChatDesktop = {
			openInternalVideoChatWindow: jest.fn(),
		};
	});

	afterAll(() => {
		delete window.RocketChatDesktop;
	});

	it('should pass to videoConfOpenCall the url', async () => {
		const { result } = renderHook(() => useVideoConfOpenCall(), { wrapper });
		const url = faker.internet.url();

		result.current(url);

		expect(window.RocketChatDesktop?.openInternalVideoChatWindow).toHaveBeenCalledWith(url, { providerName: undefined });
	});

	it('should pass to videoConfOpenCall the url and the providerName', async () => {
		const { result } = renderHook(() => useVideoConfOpenCall(), { wrapper });
		const url = faker.internet.url();
		const providerName = faker.lorem.word();

		result.current(url, providerName);

		expect(window.RocketChatDesktop?.openInternalVideoChatWindow).toHaveBeenCalledWith(url, {
			providerName,
		});
	});
});

describe('with window.RocketChatDesktop unset', () => {
	const setModal = jest.fn();
	const wrapper: React.FC = ({ children }) => (
		<ModalContext.Provider
			children={children}
			value={{
				modal: {
					setModal,
				},
				currentModal: { component: null },
			}}
		/>
	);

	it('should open window', async () => {
		const { result } = renderHook(() => useVideoConfOpenCall(), { wrapper });
		const url = faker.internet.url();

		window.open = jest.fn();

		result.current(url);

		expect(window.open).toHaveBeenCalledWith(url);
		expect(setModal).not.toBeCalled();
	});

	it('should NOT open window AND open modal', async () => {
		const { result } = renderHook(() => useVideoConfOpenCall(), { wrapper });
		const url = faker.internet.url();

		window.open = jest.fn(() => null);

		result.current(url);

		expect(window.open).toHaveBeenCalledWith(url);
		expect(window.open).toReturnWith(null);
		expect(setModal).toBeCalled();
	});
});
