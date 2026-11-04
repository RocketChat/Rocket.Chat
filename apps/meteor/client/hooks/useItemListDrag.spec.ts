import { renderHook, act, fireEvent } from '@testing-library/react';

import { useItemListDrag } from './useItemListDrag';
import { useItemListNavigation } from './useItemListNavigation';

afterEach(() => {
	document.body.innerHTML = '';
});

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
		act(() => {
			result.current.ref(list);
			navigation.current(list);
		});

		rows[0].focus();
		await act(async () => {
			fireEvent.keyDown(rows[0], { key: 'ArrowDown', metaKey: true, shiftKey: true });
		});

		expect(onMove).toHaveBeenCalledWith({ key: 'Projects', kind: 'group', group: 'Projects' }, 'down');
		expect(document.activeElement).toBe(rows[0]);
		expect(document.querySelector('[role="status"]')).toHaveTextContent('Projects moved to position 2 of 2');
	});

	it('advertises the shortcut only on the rows the keyboard can move', async () => {
		const { list, rows } = createList();
		const onMove = jest.fn();

		const { result } = renderHook(() =>
			useItemListDrag({ resolveTarget: () => undefined, onDrop: jest.fn(), onMove, canMove: (source) => source.key === 'Projects' }),
		);
		act(() => {
			result.current.ref(list);
		});

		rows[0].focus();
		rows[1].focus();
		expect(rows[0]).toHaveAttribute('aria-keyshortcuts', expect.stringContaining('Meta+Shift+ArrowDown'));
		expect(rows[1]).not.toHaveAttribute('aria-keyshortcuts');

		await act(async () => {
			fireEvent.keyDown(rows[1], { key: 'ArrowDown', ctrlKey: true, shiftKey: true });
		});
		expect(onMove).not.toHaveBeenCalled();
	});

	it('leaves the plain arrows to the list navigation', async () => {
		const { list, rows } = createList();
		const onMove = jest.fn();

		const { result } = renderHook(() => useItemListDrag({ resolveTarget: () => undefined, onDrop: jest.fn(), onMove }));
		act(() => {
			result.current.ref(list);
		});

		rows[0].focus();
		await act(async () => {
			fireEvent.keyDown(rows[0], { key: 'ArrowDown', shiftKey: true });
		});

		expect(onMove).not.toHaveBeenCalled();
	});
});
