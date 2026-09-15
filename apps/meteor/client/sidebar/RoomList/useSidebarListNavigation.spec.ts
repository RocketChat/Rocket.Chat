import { useFocusManager } from '@react-aria/focus';
import { renderHook, act, fireEvent, createEvent } from '@testing-library/react';

import { useSidebarListNavigation } from './useSidebarListNavigation';

jest.mock('@react-aria/focus', () => ({
	useFocusManager: jest.fn(),
}));

const mockFocusManager = {
	focusNext: jest.fn(),
	focusPrevious: jest.fn(),
};

beforeEach(() => {
	(useFocusManager as jest.Mock).mockReturnValue(mockFocusManager);
	mockFocusManager.focusNext.mockReset();
	mockFocusManager.focusPrevious.mockReset();
});

const createNode = (className: string) => {
	const node = document.createElement('div');
	node.className = className;
	return node;
};

const setupHook = (container: HTMLElement) => {
	const { result } = renderHook(() => useSidebarListNavigation());
	act(() => result.current.sidebarListRef(container));
	return result;
};

describe('Tab from a collapse group header', () => {
	it('moves focus to the first room, accepting rooms and groups (same predicate as ArrowDown)', () => {
		const container = document.createElement('div');
		const header = createNode('rcx-sidebar-collapse-group__bar-button');
		container.appendChild(header);
		mockFocusManager.focusNext.mockReturnValue(createNode('rcx-sidebar-item'));
		setupHook(container);

		fireEvent.keyDown(header, { key: 'Tab' });

		expect(mockFocusManager.focusNext).toHaveBeenCalledTimes(1);
		const { accept } = mockFocusManager.focusNext.mock.calls[0][0];
		expect(accept(createNode('rcx-sidebar-item'))).toBe(true);
		expect(accept(createNode('rcx-sidebar-collapse-group__bar-button'))).toBe(true);
		expect(accept(createNode('rcx-sidebar-item__menu'))).toBe(false);
	});

	it('prevents the default Tab behavior when a next room/group is found', () => {
		const container = document.createElement('div');
		const header = createNode('rcx-sidebar-collapse-group__bar-button');
		container.appendChild(header);
		mockFocusManager.focusNext.mockReturnValue(createNode('rcx-sidebar-item'));
		setupHook(container);

		const event = createEvent.keyDown(header, { key: 'Tab' });
		fireEvent(header, event);

		expect(event.defaultPrevented).toBe(true);
	});

	it('falls back to native Tab behavior when this is the last group (focusNext finds nothing)', () => {
		const container = document.createElement('div');
		const header = createNode('rcx-sidebar-collapse-group__bar-button');
		container.appendChild(header);
		mockFocusManager.focusNext.mockReturnValue(null);
		setupHook(container);

		const event = createEvent.keyDown(header, { key: 'Tab' });
		fireEvent(header, event);

		expect(mockFocusManager.focusNext).toHaveBeenCalledTimes(1);
		expect(event.defaultPrevented).toBe(false);
	});
});

describe('Tab from a room item', () => {
	it('skips other rooms and groups to land on its own kebab menu', () => {
		const container = document.createElement('div');
		const item = createNode('rcx-sidebar-item');
		container.appendChild(item);
		mockFocusManager.focusNext.mockReturnValue(createNode('rcx-sidebar-item__menu'));
		setupHook(container);

		fireEvent.keyDown(item, { key: 'Tab' });

		expect(mockFocusManager.focusNext).toHaveBeenCalledTimes(1);
		const { accept } = mockFocusManager.focusNext.mock.calls[0][0];
		expect(accept(createNode('rcx-sidebar-item'))).toBe(false);
		expect(accept(createNode('rcx-sidebar-collapse-group__bar-button'))).toBe(false);
		expect(accept(createNode('rcx-sidebar-item__menu'))).toBe(true);
	});

	it('prevents default', () => {
		const container = document.createElement('div');
		const item = createNode('rcx-sidebar-item');
		container.appendChild(item);
		mockFocusManager.focusNext.mockReturnValue(createNode('rcx-sidebar-item__menu'));
		setupHook(container);

		const event = createEvent.keyDown(item, { key: 'Tab' });
		fireEvent(item, event);

		expect(event.defaultPrevented).toBe(true);
	});
});

it('calls focusPrevious on Shift+Tab', () => {
	const container = document.createElement('div');
	const item = createNode('rcx-sidebar-item');
	container.appendChild(item);
	mockFocusManager.focusPrevious.mockReturnValue(createNode('rcx-sidebar-collapse-group__bar-button'));
	setupHook(container);

	fireEvent.keyDown(item, { key: 'Tab', shiftKey: true });

	expect(mockFocusManager.focusPrevious).toHaveBeenCalledTimes(1);
	expect(mockFocusManager.focusNext).not.toHaveBeenCalled();
});

it('ignores events whose target is neither a room item nor a collapse group', () => {
	const container = document.createElement('div');
	const other = createNode('rcx-sidebar-item__menu');
	container.appendChild(other);
	setupHook(container);

	fireEvent.keyDown(other, { key: 'Tab' });

	expect(mockFocusManager.focusNext).not.toHaveBeenCalled();
	expect(mockFocusManager.focusPrevious).not.toHaveBeenCalled();
});
