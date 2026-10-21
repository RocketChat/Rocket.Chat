import { renderHook, act, fireEvent, createEvent } from '@testing-library/react';

import { useItemListNavigation } from './useItemListNavigation';

beforeAll(() => {
	jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
		cb(0);
		return 0;
	});
});

afterAll(() => {
	jest.restoreAllMocks();
});

// The hook listens on the document, so each test detaches the lists it attached
const detachers: (() => void)[] = [];

afterEach(() => {
	detachers.splice(0).forEach((detach) => detach());
	document.body.innerHTML = '';
});

const createRow = (label: string, { withAction = false } = {}) => {
	const row = document.createElement('div');
	row.className = 'rcx-item';

	const link = document.createElement('button');
	link.className = 'rcx-item__link';
	link.textContent = label;
	row.appendChild(link);

	let action: HTMLButtonElement | undefined;
	if (withAction) {
		const actions = document.createElement('div');
		actions.className = 'rcx-item__actions';
		action = document.createElement('button');
		action.textContent = `${label} menu`;
		actions.appendChild(action);
		row.appendChild(actions);
	}

	return { row, link, action };
};

const setup = ({ rowCount = 3, withAction = false } = {}) => {
	const before = document.createElement('button');
	before.textContent = 'before';

	const scroller = document.createElement('div');
	scroller.dataset.virtuosoScroller = 'true';
	const list = document.createElement('div');
	scroller.appendChild(list);

	const after = document.createElement('button');
	after.textContent = 'after';

	document.body.append(before, scroller, after);

	const rows = Array.from({ length: rowCount }, (_, index) => {
		const created = createRow(`row ${index}`, { withAction });
		list.appendChild(created.row);
		return created;
	});

	const { result } = renderHook(() => useItemListNavigation());
	act(() => result.current(list));
	detachers.push(() => act(() => result.current(null)));

	return { before, after, scroller, list, rows, ref: result.current };
};

const pressKey = (target: HTMLElement, key: string, init: KeyboardEventInit = {}) => {
	const event = createEvent.keyDown(target, { key, ...init });
	fireEvent(target, event);
	return event;
};

describe('arrow keys between rows', () => {
	it('moves focus to the next and previous `ItemLink`', () => {
		const { rows } = setup();
		rows[1].link.focus();

		pressKey(rows[1].link, 'ArrowDown');
		expect(document.activeElement).toBe(rows[2].link);

		pressKey(rows[2].link, 'ArrowUp');
		pressKey(rows[1].link, 'ArrowUp');
		expect(document.activeElement).toBe(rows[0].link);
	});

	it('skips the row actions', () => {
		const { rows } = setup({ withAction: true });
		rows[0].link.focus();

		pressKey(rows[0].link, 'ArrowDown');

		expect(document.activeElement).toBe(rows[1].link);
	});

	it('prevents the default scroll and stops propagation', () => {
		const { rows } = setup();
		rows[0].link.focus();

		const event = createEvent.keyDown(rows[0].link, { key: 'ArrowDown' });
		jest.spyOn(event, 'stopPropagation');
		fireEvent(rows[0].link, event);

		expect(event.defaultPrevented).toBe(true);
		expect(event.stopPropagation).toHaveBeenCalled();
	});

	it('ignores keys pressed outside an `ItemLink`', () => {
		const { list, rows } = setup();
		const other = document.createElement('button');
		list.appendChild(other);
		other.focus();

		pressKey(other, 'ArrowUp');

		expect(document.activeElement).toBe(other);
		expect(rows[0].link).not.toBe(document.activeElement);
	});

	it('stops listening when the ref is detached', () => {
		const { rows, ref } = setup();
		act(() => ref(null));
		rows[0].link.focus();

		pressKey(rows[0].link, 'ArrowDown');

		expect(document.activeElement).toBe(rows[0].link);
	});
});

describe('when the adjacent row is outside the render window', () => {
	const setHeight = (element: HTMLElement, height: number) =>
		Object.defineProperty(element, 'offsetHeight', { configurable: true, get: () => height });

	it('scrolls down by one row and retries', () => {
		const { scroller, rows } = setup({ rowCount: 1 });
		setHeight(rows[0].row, 36);
		rows[0].link.focus();

		pressKey(rows[0].link, 'ArrowDown');

		expect(scroller.scrollTop).toBe(36);
	});

	it('scrolls up by one row and retries', () => {
		const { scroller, rows } = setup({ rowCount: 1 });
		setHeight(rows[0].row, 36);
		scroller.scrollTop = 100;
		rows[0].link.focus();

		pressKey(rows[0].link, 'ArrowUp');

		expect(scroller.scrollTop).toBe(64);
	});

	it('does not scroll when the row has no height', () => {
		const { scroller, rows } = setup({ rowCount: 1 });
		rows[0].link.focus();

		pressKey(rows[0].link, 'ArrowDown');

		expect(scroller.scrollTop).toBe(0);
	});
});

describe('arrow keys within a row', () => {
	it('moves from the `ItemLink` to the first action and back', () => {
		const { rows } = setup({ withAction: true });
		rows[1].link.focus();

		pressKey(rows[1].link, 'ArrowRight');
		expect(document.activeElement).toBe(rows[1].action);

		pressKey(rows[1].action!, 'ArrowLeft');
		expect(document.activeElement).toBe(rows[1].link);
	});

	it('swaps the directions in right-to-left layouts', () => {
		const { rows } = setup({ withAction: true });
		// jsdom does not inherit `direction` into the computed style
		rows[0].link.style.direction = 'rtl';
		rows[0].link.focus();

		pressKey(rows[0].link, 'ArrowRight');
		expect(document.activeElement).toBe(rows[0].link);

		pressKey(rows[0].link, 'ArrowLeft');
		expect(document.activeElement).toBe(rows[0].action);
	});

	it('stays on the `ItemLink` when the row has no focusable action', () => {
		const { rows } = setup();
		rows[0].link.focus();

		const event = pressKey(rows[0].link, 'ArrowRight');

		expect(document.activeElement).toBe(rows[0].link);
		expect(event.defaultPrevented).toBe(true);
	});
});

describe('Escape', () => {
	it('returns from a control to its row', () => {
		const { rows } = setup({ withAction: true });
		rows[1].action!.focus();

		const event = pressKey(rows[1].action!, 'Escape');

		expect(event.defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(rows[1].link);
	});

	it('leaves Escape on the row itself to the surroundings, such as closing a contextual bar', () => {
		const { rows } = setup({ withAction: true });
		rows[1].link.focus();

		const event = pressKey(rows[1].link, 'Escape');

		expect(event.defaultPrevented).toBe(false);
	});
});

describe('Tab', () => {
	it('walks the controls of the focused row, then leaves the list instead of entering the next row', () => {
		const { after, rows } = setup({ withAction: true });
		rows[0].link.focus();

		const event = pressKey(rows[0].link, 'Tab');
		expect(event.defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(rows[0].action);

		pressKey(rows[0].action!, 'Tab');
		expect(document.activeElement).toBe(after);
	});

	it('walks back to the row, then leaves the list backwards', () => {
		const { before, rows } = setup({ withAction: true });
		rows[2].action!.focus();

		pressKey(rows[2].action!, 'Tab', { shiftKey: true });
		expect(document.activeElement).toBe(rows[2].link);

		pressKey(rows[2].link, 'Tab', { shiftKey: true });
		expect(document.activeElement).toBe(before);
	});

	it('leaves the list at once from a row without controls', () => {
		const { after, rows } = setup();
		rows[1].link.focus();

		pressKey(rows[1].link, 'Tab');

		expect(document.activeElement).toBe(after);
	});

	it('wraps to the start of the page when nothing follows the list', () => {
		const { before, after, rows } = setup();
		after.remove();
		rows[0].link.focus();

		const event = pressKey(rows[0].link, 'Tab');

		expect(event.defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(before);
	});

	it('wraps to the end of the page when nothing precedes the list', () => {
		const { before, after, rows } = setup();
		before.remove();
		rows[0].link.focus();

		pressKey(rows[0].link, 'Tab', { shiftKey: true });

		expect(document.activeElement).toBe(after);
	});

	it('stays on the row instead of entering another one when nothing is focusable outside the list', () => {
		const { before, after, rows } = setup();
		before.remove();
		after.remove();
		rows[0].link.focus();

		const event = pressKey(rows[0].link, 'Tab');

		expect(event.defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(rows[0].link);
	});
});

describe('in a row matched as a whole, as a sidebar row is', () => {
	it('takes the focusable link as the row target', () => {
		const list = document.createElement('div');
		const row = document.createElement('div');
		row.className = 'rcx-item rcx-sidebar-item';
		const link = document.createElement('a');
		link.href = '#general';
		link.className = 'rcx-item__link';
		const action = document.createElement('button');
		row.append(link, action);
		list.appendChild(row);
		document.body.appendChild(list);

		const isSidebarRow = (node: Element) => node.classList.contains('rcx-sidebar-item') || node.classList.contains('rcx-item__link');
		const { result } = renderHook(() => useItemListNavigation({ isItem: isSidebarRow }));
		act(() => result.current(list));
		detachers.push(() => act(() => result.current(null)));
		action.focus();

		pressKey(action, 'Tab', { shiftKey: true });
		expect(document.activeElement).toBe(link);

		action.focus();
		pressKey(action, 'Escape');
		expect(document.activeElement).toBe(link);
	});
});

describe('coming back by keyboard', () => {
	const mockFocusVisible = (element: HTMLElement) => {
		const { matches } = element;
		jest.spyOn(element, 'matches').mockImplementation((selector) => selector === ':focus-visible' || matches.call(element, selector));
	};

	it('returns to the row focused last', () => {
		const { before, rows } = setup();
		mockFocusVisible(rows[1].link);
		rows[1].link.focus();
		before.focus();

		mockFocusVisible(rows[0].link);
		rows[0].link.focus();

		expect(document.activeElement).toBe(rows[1].link);
	});

	it('keeps a pointer focus where it lands', () => {
		const { before, rows } = setup();
		mockFocusVisible(rows[1].link);
		rows[1].link.focus();
		before.focus();

		rows[0].link.focus();

		expect(document.activeElement).toBe(rows[0].link);
	});

	it('does not remember a row focused with the pointer', () => {
		const { before, rows } = setup();
		rows[1].link.focus();
		before.focus();

		mockFocusVisible(rows[0].link);
		rows[0].link.focus();

		expect(document.activeElement).toBe(rows[0].link);
	});

	it('keeps the focus where it lands when the last row is no longer rendered', () => {
		const { before, rows } = setup();
		mockFocusVisible(rows[1].link);
		rows[1].link.focus();
		before.focus();
		rows[1].row.remove();

		mockFocusVisible(rows[0].link);
		rows[0].link.focus();

		expect(document.activeElement).toBe(rows[0].link);
	});

	it('lands on the row of a control the keyboard enters', () => {
		const { after, rows } = setup({ withAction: true });
		after.focus();

		mockFocusVisible(rows[2].action!);
		rows[2].action!.focus();

		expect(document.activeElement).toBe(rows[2].link);
	});

	it('lands on the last row first with `enterAtLast`', () => {
		const { before, list, rows, ref } = setup();
		act(() => ref(null));
		const { result } = renderHook(() => useItemListNavigation({ enterAtLast: true }));
		act(() => result.current(list));
		detachers.push(() => act(() => result.current(null)));
		before.focus();

		mockFocusVisible(rows[0].link);
		rows[0].link.focus();

		expect(document.activeElement).toBe(rows[2].link);
	});
});

describe('onLeave', () => {
	it('moves the focus where the list asks when Tab leaves it', () => {
		const { list, rows, before, ref } = setup();
		act(() => ref(null));
		const onLeave = jest.fn((direction: 'next' | 'previous') => {
			if (direction === 'previous') return false;
			before.focus();
			return true;
		});
		const { result } = renderHook(() => useItemListNavigation({ onLeave }));
		act(() => result.current(list));
		detachers.push(() => act(() => result.current(null)));
		rows[0].link.focus();

		const event = pressKey(rows[0].link, 'Tab');

		expect(onLeave).toHaveBeenCalledWith('next', list);
		expect(event.defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(before);
	});
});

describe('with a custom `isItem`', () => {
	const isRow = (node: Element) => node.getAttribute('role') === 'listitem';

	it('moves between the elements it accepts', () => {
		const list = document.createElement('div');
		const rows = Array.from({ length: 2 }, () => {
			const row = document.createElement('div');
			row.setAttribute('role', 'listitem');
			row.tabIndex = 0;
			list.appendChild(row);
			return row;
		});
		document.body.appendChild(list);

		const { result } = renderHook(() => useItemListNavigation({ isItem: isRow }));
		act(() => result.current(list));
		detachers.push(() => act(() => result.current(null)));
		rows[0].focus();

		pressKey(rows[0], 'ArrowDown');

		expect(document.activeElement).toBe(rows[1]);
	});

	describe('in a row that is its own focus target and holds a toolbar', () => {
		const setupToolbarRow = () => {
			const list = document.createElement('div');
			const row = document.createElement('div');
			row.setAttribute('role', 'listitem');
			row.tabIndex = 0;
			const link = document.createElement('a');
			link.href = '#';
			const toolbar = document.createElement('div');
			toolbar.setAttribute('role', 'toolbar');
			const actions = Array.from({ length: 2 }, () => document.createElement('button'));
			toolbar.append(...actions);
			row.append(link, toolbar);
			const after = document.createElement('button');
			document.body.append(list, after);
			list.appendChild(row);

			const { result } = renderHook(() => useItemListNavigation({ isItem: isRow, rowSelector: '[role="listitem"]' }));
			act(() => result.current(list));
			detachers.push(() => act(() => result.current(null)));

			return { row, link, actions, after };
		};

		it('walks the row with the arrow keys, entering the toolbar as one stop', () => {
			const { row, link, actions } = setupToolbarRow();
			row.focus();

			pressKey(row, 'ArrowRight');
			expect(document.activeElement).toBe(link);

			pressKey(link, 'ArrowRight');
			expect(document.activeElement).toBe(actions[0]);
		});

		it('leaves the arrow keys inside the toolbar to the toolbar', () => {
			const { actions } = setupToolbarRow();
			// Stands in for a toolbar's React `onKeyDownCapture`, which runs at the app root, after the list's listener
			const toolbarKeyDown = jest.fn();
			document.body.addEventListener('keydown', toolbarKeyDown, { capture: true });
			actions[0].focus();

			const event = pressKey(actions[0], 'ArrowRight');

			expect(event.defaultPrevented).toBe(false);
			expect(toolbarKeyDown).toHaveBeenCalled();
			document.body.removeEventListener('keydown', toolbarKeyDown, { capture: true });
		});

		it('tabs over the toolbar as one stop, coming back to the button it focused last', () => {
			const { link, actions, after } = setupToolbarRow();
			actions[1].focus();
			link.focus();

			pressKey(link, 'Tab');
			expect(document.activeElement).toBe(actions[1]);

			pressKey(actions[1], 'Tab');
			expect(document.activeElement).toBe(after);
		});

		it('returns from the toolbar to the control before it with Shift+Tab', () => {
			const { link, actions } = setupToolbarRow();
			actions[1].focus();

			pressKey(actions[1], 'Tab', { shiftKey: true });

			expect(document.activeElement).toBe(link);
		});
	});
});

describe('rows with several actions', () => {
	it('reaches each action in turn', () => {
		const { rows } = setup({ withAction: true });
		const second = document.createElement('button');
		rows[0].action!.after(second);
		rows[0].link.focus();

		pressKey(rows[0].link, 'ArrowRight');
		pressKey(rows[0].action!, 'ArrowRight');

		expect(document.activeElement).toBe(second);
	});

	it('reaches the actions of a group header', () => {
		const list = document.createElement('div');
		const header = document.createElement('div');
		header.className = 'rcx-item-group-header';
		const title = document.createElement('div');
		title.className = 'rcx-item-group-title';
		title.tabIndex = 0;
		const menu = document.createElement('button');
		header.append(title, menu);
		list.appendChild(header);
		document.body.appendChild(list);

		const isTitle = (node: Element) => node.classList.contains('rcx-item-group-title');
		const { result } = renderHook(() => useItemListNavigation({ isItem: isTitle }));
		act(() => result.current(list));
		detachers.push(() => act(() => result.current(null)));
		title.focus();

		pressKey(title, 'ArrowRight');

		expect(document.activeElement).toBe(menu);
	});
});
