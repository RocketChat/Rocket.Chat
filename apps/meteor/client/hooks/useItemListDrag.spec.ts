import { renderHook, act, fireEvent, waitFor } from '@testing-library/react';

import { useItemListDrag } from './useItemListDrag';
import { useItemListNavigation } from './useItemListNavigation';

const detachers: (() => void)[] = [];

afterEach(() => {
	detachers.splice(0).forEach((detach) => detach());
	jest.restoreAllMocks();
	document.body.innerHTML = '';
});

const attachDrag = (ref: (list: HTMLElement) => void | (() => void), list: HTMLElement) => {
	act(() => {
		const detach = ref(list);
		if (detach) {
			detachers.push(detach);
		}
	});
};

const attachNavigation = (ref: (node: HTMLElement | null) => void, list: HTMLElement) => {
	act(() => ref(list));
	detachers.push(() => ref(null));
};

const createList = () => {
	const list = document.createElement('div');
	const rows = ['Projects', 'Clients'].map((key) => {
		const row = document.createElement('div');
		row.dataset.dragKey = key;
		row.dataset.dragKind = 'group';
		row.dataset.dragGroup = key;

		const title = document.createElement('button');
		title.className = 'rcx-item-group-title';
		title.textContent = key;
		row.appendChild(title);
		list.appendChild(row);
		return title;
	});
	document.body.appendChild(list);
	return { list, rows };
};

describe('useItemListDrag', () => {
	it('moves the focused row with Cmd+Shift and an arrow, and announces where it landed', async () => {
		const { list, rows } = createList();
		const onMove = jest.fn().mockResolvedValue('Projects moved to position 2 of 2');

		const { result } = renderHook(() => useItemListDrag({ resolveTarget: () => undefined, onDrop: jest.fn(), onMove }));
		const { result: navigation } = renderHook(() => useItemListNavigation({ isItem: (node) => node.tagName === 'BUTTON' }));
		attachDrag(result.current.ref, list);
		attachNavigation(navigation.current, list);

		rows[0].focus();
		fireEvent.keyDown(rows[0], { key: 'ArrowDown', metaKey: true, shiftKey: true });

		expect(onMove).toHaveBeenCalledWith({ key: 'Projects', kind: 'group', group: 'Projects' }, 'down');
		await waitFor(() => expect(document.querySelector('[role="status"]')).toHaveTextContent('Projects moved to position 2 of 2'));
		expect(document.activeElement).toBe(rows[0]);
	});

	it('advertises the shortcut only on the rows the keyboard can move', () => {
		const { list, rows } = createList();
		const onMove = jest.fn();

		const { result } = renderHook(() =>
			useItemListDrag({ resolveTarget: () => undefined, onDrop: jest.fn(), onMove, canMove: (source) => source.key === 'Projects' }),
		);
		attachDrag(result.current.ref, list);

		rows[0].focus();
		rows[1].focus();
		expect(rows[0]).toHaveAttribute('aria-keyshortcuts', expect.stringContaining('Meta+Shift+ArrowDown'));
		expect(rows[1]).not.toHaveAttribute('aria-keyshortcuts');

		fireEvent.keyDown(rows[1], { key: 'ArrowDown', ctrlKey: true, shiftKey: true });
		expect(onMove).not.toHaveBeenCalled();
	});

	it('keeps the focus and announces nothing when the move fails', async () => {
		const { list, rows } = createList();
		const onMove = jest.fn().mockRejectedValue(new Error('offline'));

		const { result } = renderHook(() => useItemListDrag({ resolveTarget: () => undefined, onDrop: jest.fn(), onMove }));
		attachDrag(result.current.ref, list);

		rows[0].focus();
		fireEvent.keyDown(rows[0], { key: 'ArrowDown', metaKey: true, shiftKey: true });

		await waitFor(() => expect(onMove).toHaveBeenCalled());
		await act(async () => undefined);
		expect(document.querySelector('[role="status"]')).toBeEmptyDOMElement();
		expect(document.activeElement).toBe(rows[0]);
	});

	it('ignores the shortcut while a move is still saving', async () => {
		const { list, rows } = createList();
		let save: (message?: string) => void = () => undefined;
		const onMove = jest.fn(
			() =>
				new Promise<string | undefined>((resolve) => {
					save = resolve;
				}),
		);

		const { result } = renderHook(() => useItemListDrag({ resolveTarget: () => undefined, onDrop: jest.fn(), onMove }));
		attachDrag(result.current.ref, list);

		rows[0].focus();
		fireEvent.keyDown(rows[0], { key: 'ArrowDown', metaKey: true, shiftKey: true });
		fireEvent.keyDown(rows[0], { key: 'ArrowUp', metaKey: true, shiftKey: true });
		expect(onMove).toHaveBeenCalledTimes(1);

		await act(async () => save());
		fireEvent.keyDown(rows[0], { key: 'ArrowUp', metaKey: true, shiftKey: true });
		expect(onMove).toHaveBeenCalledTimes(2);
		expect(onMove).toHaveBeenLastCalledWith({ key: 'Projects', kind: 'group', group: 'Projects' }, 'up');
	});

	it('leaves the shortcut to text fields inside a row', () => {
		const { list } = createList();
		const input = document.createElement('input');
		list.querySelector('[data-drag-key="Projects"]')!.appendChild(input);
		const onMove = jest.fn();

		const { result } = renderHook(() => useItemListDrag({ resolveTarget: () => undefined, onDrop: jest.fn(), onMove }));
		attachDrag(result.current.ref, list);

		input.focus();
		fireEvent.keyDown(input, { key: 'ArrowDown', metaKey: true, shiftKey: true });

		expect(onMove).not.toHaveBeenCalled();
	});

	it('ends a drag in progress when the list is detached', () => {
		const { list, rows } = createList();

		const { result } = renderHook(() => useItemListDrag({ resolveTarget: () => undefined, onDrop: jest.fn() }));
		let detach: void | (() => void);
		act(() => {
			detach = result.current.ref(list);
		});

		// jsdom has no hit testing nor PointerEvent: nothing is under the pointer, and mouse events carry its coordinates.
		jest.spyOn(document, 'elementsFromPoint').mockReturnValue([]);
		rows[0].dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 0, clientY: 0 }));
		act(() => {
			window.dispatchEvent(new MouseEvent('pointermove', { clientX: 0, clientY: 20 }));
		});
		expect(document.querySelector('.rcx-item-drag-shield')).toBeInTheDocument();

		act(() => detach?.());

		expect(document.querySelector('.rcx-item-drag-shield')).not.toBeInTheDocument();
		expect(document.querySelector('.rcx-item-drag-preview')).not.toBeInTheDocument();
		expect(result.current.source).toBeUndefined();
	});
});
