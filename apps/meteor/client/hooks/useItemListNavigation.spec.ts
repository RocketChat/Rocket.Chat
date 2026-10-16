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

afterEach(() => {
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
		rows[0].row.style.direction = 'rtl';
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
		expect(event.defaultPrevented).toBe(false);
	});
});

describe('Tab', () => {
	it('leaves the list forwards from any row', () => {
		const { after, rows } = setup({ withAction: true });
		rows[0].link.focus();

		const event = pressKey(rows[0].link, 'Tab');

		expect(event.defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(after);
	});

	it('leaves the list backwards from any row', () => {
		const { before, rows } = setup({ withAction: true });
		rows[2].action!.focus();

		pressKey(rows[2].action!, 'Tab', { shiftKey: true });

		expect(document.activeElement).toBe(before);
	});

	it('keeps the browser default when nothing is focusable outside the list', () => {
		const { before, after, rows } = setup();
		before.remove();
		after.remove();
		rows[0].link.focus();

		const event = pressKey(rows[0].link, 'Tab');

		expect(event.defaultPrevented).toBe(false);
	});
});

describe('coming back by keyboard', () => {
	const mockFocusVisible = (element: HTMLElement) => {
		const { matches } = element;
		jest.spyOn(element, 'matches').mockImplementation((selector) => selector === ':focus-visible' || matches.call(element, selector));
	};

	it('returns to the row focused last', () => {
		const { before, rows } = setup();
		rows[1].link.focus();
		before.focus();

		mockFocusVisible(rows[0].link);
		rows[0].link.focus();

		expect(document.activeElement).toBe(rows[1].link);
	});

	it('keeps a pointer focus where it lands', () => {
		const { before, rows } = setup();
		rows[1].link.focus();
		before.focus();

		rows[0].link.focus();

		expect(document.activeElement).toBe(rows[0].link);
	});

	it('keeps the focus where it lands when the last row is no longer rendered', () => {
		const { before, rows } = setup();
		rows[1].link.focus();
		before.focus();
		rows[1].row.remove();

		mockFocusVisible(rows[0].link);
		rows[0].link.focus();

		expect(document.activeElement).toBe(rows[0].link);
	});
});
