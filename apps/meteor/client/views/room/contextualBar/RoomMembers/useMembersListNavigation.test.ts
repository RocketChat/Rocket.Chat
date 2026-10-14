import { after, before, beforeEach, describe, it } from 'node:test';

import { renderHook, act, fireEvent, createEvent } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike, Mock } from 'jest-mock';
import proxyquire from 'proxyquire';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
const spyOn: ModuleMocker['spyOn'] = mocker.spyOn.bind(mocker);

const mockFocusManager = {
	focusNext: fn<FunctionLike>(),
	focusPrevious: fn<FunctionLike>(),
};

const focusMock = {
	createFocusManager: fn<FunctionLike>(),
};

const { createFocusManager } = focusMock as unknown as typeof import('@react-aria/focus');

const { useMembersListNavigation } = proxyquire
	.noCallThru()
	.load<typeof import('./useMembersListNavigation')>('./useMembersListNavigation', {
		'@react-aria/focus': focusMock,
	});

const createList = (itemCount = 2) => {
	const container = document.createElement('div');
	const items = Array.from({ length: itemCount }, () => {
		const li = document.createElement('li');
		container.appendChild(li);
		return li;
	});
	document.body.appendChild(container);
	return { container, items, cleanup: () => document.body.removeChild(container) };
};

const setupHook = (container: HTMLElement) => {
	const { result } = renderHook(() => useMembersListNavigation());
	act(() => result.current.membersListRef(container));
	return result;
};

describe('useMembersListNavigation', () => {
	before(() => {
		spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
			cb(0);
			return 0;
		});
	});

	after(() => {
		mocker.restoreAllMocks();
	});

	beforeEach(() => {
		(createFocusManager as Mock<FunctionLike>).mockReturnValue(mockFocusManager);
		mockFocusManager.focusNext.mockReset().mockReturnValue(document.createElement('li'));
		mockFocusManager.focusPrevious.mockReset().mockReturnValue(document.createElement('li'));
	});

	it('creates a focus manager scoped to the list node', () => {
		const { container, cleanup } = createList();
		setupHook(container);

		expect(createFocusManager).toHaveBeenCalledWith({ current: container });
		cleanup();
	});

	it('calls focusNext with an LI-matching predicate on ArrowDown', () => {
		const { container, items, cleanup } = createList();
		setupHook(container);

		fireEvent.keyDown(items[0], { key: 'ArrowDown' });

		expect(mockFocusManager.focusNext).toHaveBeenCalledTimes(1);
		expect(mockFocusManager.focusPrevious).not.toHaveBeenCalled();

		const { accept } = mockFocusManager.focusNext.mock.calls[0][0];
		expect(accept(document.createElement('li'))).toBe(true);
		expect(accept(document.createElement('div'))).toBe(false);
		expect(accept(document.createElement('button'))).toBe(false);
		cleanup();
	});

	it('calls focusPrevious with an LI-matching predicate on ArrowUp', () => {
		const { container, items, cleanup } = createList();
		setupHook(container);

		fireEvent.keyDown(items[1], { key: 'ArrowUp' });

		expect(mockFocusManager.focusPrevious).toHaveBeenCalledTimes(1);
		expect(mockFocusManager.focusNext).not.toHaveBeenCalled();

		const { accept } = mockFocusManager.focusPrevious.mock.calls[0][0];
		expect(accept(document.createElement('li'))).toBe(true);
		expect(accept(document.createElement('div'))).toBe(false);
		cleanup();
	});

	it('ignores events whose target is not an LI element', () => {
		const { container, cleanup } = createList(0);
		setupHook(container);

		const div = document.createElement('div');
		container.appendChild(div);
		fireEvent.keyDown(div, { key: 'ArrowDown' });

		expect(mockFocusManager.focusNext).not.toHaveBeenCalled();
		cleanup();
	});

	it('ignores non-arrow keys', () => {
		const { container, items, cleanup } = createList();
		setupHook(container);

		['Enter', 'Tab', ' ', 'Escape'].forEach((key) => fireEvent.keyDown(items[0], { key }));

		expect(mockFocusManager.focusNext).not.toHaveBeenCalled();
		expect(mockFocusManager.focusPrevious).not.toHaveBeenCalled();
		cleanup();
	});

	it('prevents default and stops propagation on arrow keys', () => {
		const { container, items, cleanup } = createList();
		setupHook(container);

		const event = createEvent.keyDown(items[0], { key: 'ArrowDown' });
		spyOn(event, 'stopPropagation');
		fireEvent(items[0], event);

		expect(event.defaultPrevented).toBe(true);
		expect(event.stopPropagation).toHaveBeenCalled();
		cleanup();
	});

	it('removes the event listener when called with null', () => {
		const { container, items, cleanup } = createList();
		const result = setupHook(container);

		act(() => result.current.membersListRef(null));
		const afterNull = createEvent.keyDown(items[0], { key: 'ArrowDown' });
		fireEvent(items[0], afterNull);

		expect(mockFocusManager.focusNext).not.toHaveBeenCalled();
		cleanup();
	});

	it('replaces the listener without duplicating it when called twice with the same node', () => {
		const { container, items, cleanup } = createList();
		const result = setupHook(container);

		act(() => result.current.membersListRef(container));
		const secondCall = createEvent.keyDown(items[0], { key: 'ArrowDown' });
		fireEvent(items[0], secondCall);

		expect(mockFocusManager.focusNext).toHaveBeenCalledTimes(1);
		cleanup();
	});

	describe('when the adjacent item is outside the render window', () => {
		beforeEach(() => {
			mockFocusManager.focusNext.mockReturnValue(null);
			mockFocusManager.focusPrevious.mockReturnValue(null);
		});

		const createScrollableSetup = (initialScrollTop = 0) => {
			const scroller = document.createElement('div');
			scroller.scrollTop = initialScrollTop;
			const listNode = document.createElement('div');
			scroller.appendChild(listNode);
			document.body.appendChild(scroller);

			const li = document.createElement('li');
			Object.defineProperty(li, 'offsetHeight', { configurable: true, get: () => 36 });
			listNode.appendChild(li);

			setupHook(listNode);

			return { scroller, li, cleanup: () => document.body.removeChild(scroller) };
		};

		it('scrolls down by one item height and retries focusNext', () => {
			const { scroller, li, cleanup } = createScrollableSetup(0);

			fireEvent.keyDown(li, { key: 'ArrowDown' });

			expect(scroller.scrollTop).toBe(36);
			expect(mockFocusManager.focusNext).toHaveBeenCalledTimes(2);
			cleanup();
		});

		it('scrolls up by one item height and retries focusPrevious', () => {
			const { scroller, li, cleanup } = createScrollableSetup(100);

			fireEvent.keyDown(li, { key: 'ArrowUp' });

			expect(scroller.scrollTop).toBe(64);
			expect(mockFocusManager.focusPrevious).toHaveBeenCalledTimes(2);
			cleanup();
		});

		it('does not scroll or retry when the item has no height', () => {
			const { container, items, cleanup } = createList();
			setupHook(container);

			// offsetHeight defaults to 0 in jsdom — the fallback is skipped
			fireEvent.keyDown(items[0], { key: 'ArrowDown' });

			expect(mockFocusManager.focusNext).toHaveBeenCalledTimes(1);
			cleanup();
		});
	});
});
