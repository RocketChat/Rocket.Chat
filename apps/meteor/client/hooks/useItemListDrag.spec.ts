import { renderHook, act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
	const groups: HTMLDivElement[] = [];
	const rows = ['Projects', 'Clients'].map((key) => {
		const row = document.createElement('div');
		groups.push(row);
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
	return { list, rows, groups };
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
		await userEvent.keyboard('{Meta>}{Shift>}{ArrowDown}{/Shift}{/Meta}');

		expect(onMove).toHaveBeenCalledWith({ key: 'Projects', kind: 'group', group: 'Projects' }, 'down');
		await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Projects moved to position 2 of 2'));
		expect(rows[0]).toHaveFocus();
	});

	it('advertises the shortcut only on the rows the keyboard can move', async () => {
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

		await userEvent.keyboard('{Control>}{Shift>}{ArrowDown}{/Shift}{/Control}');
		expect(onMove).not.toHaveBeenCalled();
	});

	it('keeps the focus and announces nothing when the move fails', async () => {
		const { list, rows } = createList();
		const onMove = jest.fn().mockRejectedValue(new Error('offline'));

		const { result } = renderHook(() => useItemListDrag({ resolveTarget: () => undefined, onDrop: jest.fn(), onMove }));
		attachDrag(result.current.ref, list);

		rows[0].focus();
		await userEvent.keyboard('{Meta>}{Shift>}{ArrowDown}{/Shift}{/Meta}');

		await waitFor(() => expect(onMove).toHaveBeenCalled());
		await act(async () => undefined);
		expect(screen.getByRole('status')).toBeEmptyDOMElement();
		expect(rows[0]).toHaveFocus();
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
		await userEvent.keyboard('{Meta>}{Shift>}{ArrowDown}{/Shift}{/Meta}');
		await userEvent.keyboard('{Meta>}{Shift>}{ArrowUp}{/Shift}{/Meta}');
		expect(onMove).toHaveBeenCalledTimes(1);

		await act(async () => save());
		await userEvent.keyboard('{Meta>}{Shift>}{ArrowUp}{/Shift}{/Meta}');
		expect(onMove).toHaveBeenCalledTimes(2);
		expect(onMove).toHaveBeenLastCalledWith({ key: 'Projects', kind: 'group', group: 'Projects' }, 'up');
	});

	it('leaves the shortcut to text fields inside a row', async () => {
		const { list, groups } = createList();
		const input = document.createElement('input');
		groups[0].appendChild(input);
		const onMove = jest.fn();

		const { result } = renderHook(() => useItemListDrag({ resolveTarget: () => undefined, onDrop: jest.fn(), onMove }));
		attachDrag(result.current.ref, list);

		input.focus();
		await userEvent.keyboard('{Meta>}{Shift>}{ArrowDown}{/Shift}{/Meta}');

		expect(onMove).not.toHaveBeenCalled();
	});

	it('lifts a copy of the row without its actions', () => {
		const { list, rows } = createList();
		const actions = document.createElement('div');
		actions.className = 'rcx-item__actions';
		list.querySelector('[data-drag-key="Projects"]')!.appendChild(actions);

		const { result } = renderHook(() => useItemListDrag({ resolveTarget: () => undefined, onDrop: jest.fn() }));
		attachDrag(result.current.ref, list);

		jest.spyOn(document, 'elementsFromPoint').mockReturnValue([]);
		rows[0].dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 0, clientY: 0 }));
		act(() => {
			window.dispatchEvent(new MouseEvent('pointermove', { clientX: 0, clientY: 20 }));
		});

		const preview = document.querySelector('.rcx-item-drag-preview') as HTMLElement;
		expect(preview).toBeInTheDocument();
		expect(preview.querySelector('[data-drag-key="Projects"]')).not.toBeNull();
		expect(preview.querySelector('.rcx-item__actions')).toBeNull();
		expect(list.querySelector('.rcx-item__actions')).not.toBeNull();
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
		// oxlint-disable-next-line testing-library/no-node-access -- the drag shield is an inert overlay with no accessible query
		expect(document.querySelector('.rcx-item-drag-shield')).toBeInTheDocument();

		act(() => detach?.());

		// oxlint-disable-next-line testing-library/no-node-access -- the drag shield is an inert overlay with no accessible query
		expect(document.querySelector('.rcx-item-drag-shield')).not.toBeInTheDocument();
		// oxlint-disable-next-line testing-library/no-node-access -- the drag preview is an inert overlay with no accessible query
		expect(document.querySelector('.rcx-item-drag-preview')).not.toBeInTheDocument();
		expect(result.current.source).toBeUndefined();
	});
});
