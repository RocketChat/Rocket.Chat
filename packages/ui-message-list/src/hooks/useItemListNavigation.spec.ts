import { renderHook, act, fireEvent, createEvent } from '@testing-library/react';

import { useItemListNavigation } from './useItemListNavigation';

type Options = NonNullable<Parameters<typeof useItemListNavigation>[0]>;

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

const setup = ({ rowCount = 3, withAction = false, options }: { rowCount?: number; withAction?: boolean; options?: Options } = {}) => {
	const before = document.createElement('button');
	before.textContent = 'before';

	const list = document.createElement('div');

	const after = document.createElement('button');
	after.textContent = 'after';

	document.body.append(before, list, after);

	const rows = Array.from({ length: rowCount }, (_, index) => {
		const created = createRow(`row ${index}`, { withAction });
		list.appendChild(created.row);
		return created;
	});

	const { result } = renderHook(() => useItemListNavigation(options));
	act(() => result.current(list));
	detachers.push(() => act(() => result.current(null)));

	return { before, after, list, rows, ref: result.current };
};

const pressKey = (target: HTMLElement, key: string, init: KeyboardEventInit = {}) => {
	const event = createEvent.keyDown(target, { key, ...init });
	fireEvent(target, event);
	return event;
};

describe('arrow keys between rows', () => {
	it('moves focus to the next and previous `ItemLink` (R66)', () => {
		const { rows } = setup();
		rows[1].link.focus();

		pressKey(rows[1].link, 'ArrowDown');
		expect(document.activeElement).toBe(rows[2].link);

		pressKey(rows[2].link, 'ArrowUp');
		pressKey(rows[1].link, 'ArrowUp');
		expect(document.activeElement).toBe(rows[0].link);
	});

	it('skips the row actions (R66)', () => {
		const { rows } = setup({ withAction: true });
		rows[0].link.focus();

		pressKey(rows[0].link, 'ArrowDown');

		expect(document.activeElement).toBe(rows[1].link);
	});

	it('prevents the default scroll and stops propagation (R66)', () => {
		const { rows } = setup();
		rows[0].link.focus();

		const event = createEvent.keyDown(rows[0].link, { key: 'ArrowDown' });
		jest.spyOn(event, 'stopPropagation');
		fireEvent(rows[0].link, event);

		expect(event.defaultPrevented).toBe(true);
		expect(event.stopPropagation).toHaveBeenCalled();
	});

	it('ignores keys pressed outside an `ItemLink` (R66)', () => {
		const { list, rows } = setup();
		const other = document.createElement('button');
		list.appendChild(other);
		other.focus();

		pressKey(other, 'ArrowUp');

		expect(document.activeElement).toBe(other);
		expect(rows[0].link).not.toBe(document.activeElement);
	});

	it('stops listening when the ref is detached (R66)', () => {
		const { rows, ref } = setup();
		act(() => ref(null));
		rows[0].link.focus();

		pressKey(rows[0].link, 'ArrowDown');

		expect(document.activeElement).toBe(rows[0].link);
	});
});

describe('when the adjacent row is outside the render window', () => {
	it('asks the list to bring the next row in, then retries (R66)', () => {
		const scrollToAdjacentRow = jest.fn((item: HTMLElement) => {
			const next = createRow('late row');
			item.closest('.rcx-item')?.after(next.row);
		});
		const { rows } = setup({ rowCount: 1, options: { scrollToAdjacentRow } });
		rows[0].link.focus();

		pressKey(rows[0].link, 'ArrowDown');

		expect(scrollToAdjacentRow).toHaveBeenCalledWith(rows[0].link, 'down');
		expect(document.activeElement).toHaveTextContent('late row');
	});

	it('asks the list to bring the previous row in, then retries (R66)', () => {
		const scrollToAdjacentRow = jest.fn((item: HTMLElement) => {
			const previous = createRow('early row');
			item.closest('.rcx-item')?.before(previous.row);
		});
		const { rows } = setup({ rowCount: 1, options: { scrollToAdjacentRow } });
		rows[0].link.focus();

		pressKey(rows[0].link, 'ArrowUp');

		expect(scrollToAdjacentRow).toHaveBeenCalledWith(rows[0].link, 'up');
		expect(document.activeElement).toHaveTextContent('early row');
	});

	it('does not ask when the adjacent row is rendered, and reports the move (R66)', () => {
		const scrollToAdjacentRow = jest.fn();
		const onMoveBetweenRows = jest.fn();
		const { rows } = setup({ rowCount: 2, options: { scrollToAdjacentRow, onMoveBetweenRows } });
		rows[0].link.focus();

		pressKey(rows[0].link, 'ArrowDown');

		expect(scrollToAdjacentRow).not.toHaveBeenCalled();
		expect(onMoveBetweenRows).toHaveBeenCalledTimes(1);
		expect(document.activeElement).toBe(rows[1].link);
	});

	it('never scrolls the list by itself (R66)', () => {
		const { rows } = setup({ rowCount: 1 });
		rows[0].link.focus();

		pressKey(rows[0].link, 'ArrowDown');

		expect(document.activeElement).toBe(rows[0].link);
	});
});

describe('Escape', () => {
	it('returns from a control to its row (R68)', () => {
		const { rows } = setup({ withAction: true });
		rows[1].action!.focus();

		const event = pressKey(rows[1].action!, 'Escape');

		expect(event.defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(rows[1].link);
	});

	it('leaves Escape on the row itself to the surroundings, such as closing a contextual bar (R68)', () => {
		const { rows } = setup({ withAction: true });
		rows[1].link.focus();

		const event = pressKey(rows[1].link, 'Escape');

		expect(event.defaultPrevented).toBe(false);
	});
});

describe('Tab', () => {
	it('walks the controls of the focused row, then leaves the list instead of entering the next row (R67)', () => {
		const { after, rows } = setup({ withAction: true });
		rows[0].link.focus();

		const event = pressKey(rows[0].link, 'Tab');
		expect(event.defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(rows[0].action);

		pressKey(rows[0].action!, 'Tab');
		expect(document.activeElement).toBe(after);
	});

	it('walks back to the row, then leaves the list backwards (R67)', () => {
		const { before, rows } = setup({ withAction: true });
		rows[2].action!.focus();

		pressKey(rows[2].action!, 'Tab', { shiftKey: true });
		expect(document.activeElement).toBe(rows[2].link);

		pressKey(rows[2].link, 'Tab', { shiftKey: true });
		expect(document.activeElement).toBe(before);
	});

	it('leaves the list at once from a row without controls (R67)', () => {
		const { after, rows } = setup();
		rows[1].link.focus();

		pressKey(rows[1].link, 'Tab');

		expect(document.activeElement).toBe(after);
	});

	it('wraps to the start of the page when nothing follows the list (R67)', () => {
		const { before, after, rows } = setup();
		after.remove();
		rows[0].link.focus();

		const event = pressKey(rows[0].link, 'Tab');

		expect(event.defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(before);
	});

	it('wraps to the end of the page when nothing precedes the list (R67)', () => {
		const { before, after, rows } = setup();
		before.remove();
		rows[0].link.focus();

		pressKey(rows[0].link, 'Tab', { shiftKey: true });

		expect(document.activeElement).toBe(after);
	});

	it('stays on the row instead of entering another one when nothing is focusable outside the list (R67)', () => {
		const { before, after, rows } = setup();
		before.remove();
		after.remove();
		rows[0].link.focus();

		const event = pressKey(rows[0].link, 'Tab');

		expect(event.defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(rows[0].link);
	});

	describe('on a video player', () => {
		const addVideo = (row: HTMLElement) => {
			const video = document.createElement('video');
			video.controls = true;
			video.tabIndex = 0;
			row.appendChild(video);
			return video;
		};

		const mockFocusVisible = (element: HTMLElement) => {
			const { matches } = element;
			jest.spyOn(element, 'matches').mockImplementation((selector) => selector === ':focus-visible' || matches.call(element, selector));
		};

		it('leaves Tab to the browser, which walks the native controls (R68)', () => {
			const { rows } = setup();
			const video = addVideo(rows[0].row);
			video.focus();

			const event = pressKey(video, 'Tab');

			expect(event.defaultPrevented).toBe(false);
		});

		it('leaves the list once the browser moves past the controls into another row (R68)', () => {
			const { after, rows } = setup();
			const video = addVideo(rows[0].row);
			video.focus();

			pressKey(video, 'Tab');
			mockFocusVisible(rows[1].link);
			rows[1].link.focus();

			expect(document.activeElement).toBe(after);
		});

		it('keeps the focus where the browser moves it inside the row (R68)', () => {
			const { rows } = setup();
			const video = addVideo(rows[0].row);
			video.focus();

			pressKey(video, 'Tab', { shiftKey: true });
			mockFocusVisible(rows[0].link);
			rows[0].link.focus();

			expect(document.activeElement).toBe(rows[0].link);
		});

		it('keeps the focus where a click moves it after tabbing into the controls (R68)', () => {
			const { rows } = setup();
			const video = addVideo(rows[0].row);
			const reaction = document.createElement('button');
			rows[0].row.appendChild(reaction);
			const composer = document.createElement('textarea');
			document.body.appendChild(composer);
			video.focus();

			pressKey(video, 'Tab');
			fireEvent.pointerDown(composer);
			mockFocusVisible(composer);
			composer.focus();

			expect(document.activeElement).toBe(composer);
		});
	});

	it('reaches the actions of a group header (R67)', () => {
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

		pressKey(title, 'Tab');

		expect(document.activeElement).toBe(menu);
	});
});

describe('in a row matched as a whole, as a sidebar row is', () => {
	it('takes the focusable link as the row target (R66)', () => {
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

	it('returns to the row focused last (R66)', () => {
		const { before, rows } = setup();
		mockFocusVisible(rows[1].link);
		rows[1].link.focus();
		before.focus();

		mockFocusVisible(rows[0].link);
		rows[0].link.focus();

		expect(document.activeElement).toBe(rows[1].link);
	});

	it('keeps a pointer focus where it lands (R66)', () => {
		const { before, rows } = setup();
		mockFocusVisible(rows[1].link);
		rows[1].link.focus();
		before.focus();

		rows[0].link.focus();

		expect(document.activeElement).toBe(rows[0].link);
	});

	it('does not remember a row focused with the pointer (R66)', () => {
		const { before, rows } = setup();
		rows[1].link.focus();
		before.focus();

		mockFocusVisible(rows[0].link);
		rows[0].link.focus();

		expect(document.activeElement).toBe(rows[0].link);
	});

	it('keeps the focus where it lands when the last row is no longer rendered (R66)', () => {
		const { before, rows } = setup();
		mockFocusVisible(rows[1].link);
		rows[1].link.focus();
		before.focus();
		rows[1].row.remove();

		mockFocusVisible(rows[0].link);
		rows[0].link.focus();

		expect(document.activeElement).toBe(rows[0].link);
	});

	it('lands on the row of a control the keyboard enters (R66)', () => {
		const { after, rows } = setup({ withAction: true });
		after.focus();

		mockFocusVisible(rows[2].action!);
		rows[2].action!.focus();

		expect(document.activeElement).toBe(rows[2].link);
	});

	it('lands on the last row first with `enterAtLast` (R66)', () => {
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
	it('moves the focus where the list asks when Tab leaves it (R67)', () => {
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

	it('moves between the elements it accepts (R66)', () => {
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

		it('tabs over the toolbar as one stop, coming back to the button it focused last (R66)', () => {
			const { link, actions, after } = setupToolbarRow();
			actions[1].focus();
			link.focus();

			pressKey(link, 'Tab');
			expect(document.activeElement).toBe(actions[1]);

			pressKey(actions[1], 'Tab');
			expect(document.activeElement).toBe(after);
		});

		it('returns from the toolbar to the control before it with Shift+Tab (R66)', () => {
			const { link, actions } = setupToolbarRow();
			actions[1].focus();

			pressKey(actions[1], 'Tab', { shiftKey: true });

			expect(document.activeElement).toBe(link);
		});
	});
});

describe('keys that belong to something else', () => {
	it('leaves Left and Right to the focused control (R68)', () => {
		const { rows } = setup();
		rows[0].link.focus();

		const left = pressKey(rows[0].link, 'ArrowLeft');
		const right = pressKey(rows[0].link, 'ArrowRight');

		expect(left.defaultPrevented).toBe(false);
		expect(right.defaultPrevented).toBe(false);
		expect(document.activeElement).toBe(rows[0].link);
	});

	it.each([
		['Shift+Ctrl', { shiftKey: true, ctrlKey: true }],
		['Shift+Cmd', { shiftKey: true, metaKey: true }],
	])('does not move the focus between rows with %s and an arrow (R68)', (_, modifiers) => {
		const { rows } = setup();
		rows[0].link.focus();

		const event = pressKey(rows[0].link, 'ArrowDown', modifiers);

		expect(event.defaultPrevented).toBe(false);
		expect(document.activeElement).toBe(rows[0].link);
	});

	it('leaves the keys typed in a text field to the field (R68)', () => {
		const { rows } = setup();
		const field = document.createElement('input');
		rows[0].row.appendChild(field);
		field.focus();

		const event = pressKey(field, 'ArrowDown');

		expect(event.defaultPrevented).toBe(false);
		expect(document.activeElement).toBe(field);
	});
});
