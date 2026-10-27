import { createFocusManager, getFocusableTreeWalker } from '@react-aria/focus';
import type { RefCallback } from 'react';
import { useCallback, useRef } from 'react';

const isItemLink = (node: Element) => node.classList.contains('rcx-item__link');

const isTextField = (element: HTMLElement) =>
	element.isContentEditable || element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT';

const findScroller = (element: HTMLElement) => {
	for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
		const { overflowY } = getComputedStyle(ancestor);
		if ((overflowY === 'auto' || overflowY === 'scroll') && ancestor.scrollHeight > ancestor.clientHeight) {
			return ancestor;
		}
	}
	return null;
};

type ItemListNavigationOptions = {
	/**
	 * Tells which elements are the rows' focus targets, the ones the up and down arrows move between. Defaults to the `ItemLink`s.
	 */
	isItem?: (node: Element) => boolean;
	/**
	 * Matches the element that bounds a row; every tabbable control inside it is one stop of Tab, and a toolbar is a single
	 * stop. Defaults to `Item` rows and `ItemGroupHeader`s.
	 */
	rowSelector?: string;
	/**
	 * Lands the first keyboard entry on the last row instead of the one Tab reaches, as a message list opens on its latest message.
	 */
	enterAtLast?: boolean;
	/**
	 * Moves the focus out of the list itself, such as to the composer, when Tab or Shift+Tab leaves it. Returns whether it moved
	 * the focus; otherwise the list moves it to the next or previous tabbable element of the page.
	 */
	onLeave?: (direction: 'next' | 'previous', list: HTMLElement) => boolean;
};

/**
 * Makes a list a single tab stop: the up and down arrows move between rows, including rows a virtualized list has not
 * rendered yet; Tab walks the controls of the focused row, and Tab past its last control leaves the list instead of entering
 * the next row; Escape returns from a control to its row. The left and right arrows stay with the focused control. Coming
 * back to the list by keyboard returns to the row focused last.
 *
 * Pass module-level functions as options to keep the ref stable.
 */
export const useItemListNavigation = ({
	isItem = isItemLink,
	rowSelector = '.rcx-item, .rcx-item-group-header',
	enterAtLast = false,
	onLeave,
}: ItemListNavigationOptions = {}): RefCallback<HTMLElement> => {
	const cleanupRef = useRef<(() => void) | null>(null);

	return useCallback(
		(node: HTMLElement | null) => {
			cleanupRef.current?.();
			cleanupRef.current = null;

			if (!node) return;

			const focusManager = createFocusManager({ current: node });
			const documentFocusManager = createFocusManager({ current: node.ownerDocument.body });
			let lastItem: HTMLElement | null = null;

			const leaveList = (e: KeyboardEvent) => {
				if (onLeave?.(e.shiftKey ? 'previous' : 'next', node)) {
					e.preventDefault();
					e.stopPropagation();
					return;
				}

				const outsideList = { tabbable: true, accept: (element: Element) => !node.contains(element) };
				// With nothing past the list, wrap to the other end of the page; with nothing outside it at all, stay, rather than
				// letting the browser stop on another row
				if (e.shiftKey) {
					documentFocusManager.focusPrevious({ ...outsideList, from: node }) ?? documentFocusManager.focusLast(outsideList);
				} else {
					documentFocusManager.focusNext({ ...outsideList, from: node }) ?? documentFocusManager.focusFirst(outsideList);
				}
				e.preventDefault();
				e.stopPropagation();
			};

			// A row's focus target must take focus: a sidebar row matches as a whole, while its link is what receives focus
			const isFocusTarget = (element: Element) => isItem(element) && (element as HTMLElement).tabIndex >= 0;

			const moveBetweenRows = (e: KeyboardEvent, item: HTMLElement) => {
				e.preventDefault();
				e.stopPropagation();

				const isUp = e.key === 'ArrowUp';
				const moved = isUp ? focusManager.focusPrevious({ accept: isItem }) : focusManager.focusNext({ accept: isItem });

				if (moved) return;

				// The adjacent row is outside the render window: scroll it in and retry
				const scroller = item.closest<HTMLElement>('[data-virtuoso-scroller]') ?? findScroller(item);
				const itemHeight = (item.closest<HTMLElement>(rowSelector) ?? item).offsetHeight;
				if (!scroller || itemHeight <= 0) return;

				scroller.scrollTop = isUp ? Math.max(0, scroller.scrollTop - itemHeight) : scroller.scrollTop + itemHeight;
				requestAnimationFrame(() => {
					if (!node.isConnected) return;
					if (isUp) {
						focusManager.focusPrevious({ accept: isItem });
					} else {
						focusManager.focusNext({ accept: isItem });
					}
				});
			};

			// The button each toolbar focused last, so coming back to a toolbar returns to it, as the toolbar pattern asks
			const toolbarMemory = new WeakMap<HTMLElement, HTMLElement>();

			const toolbarOf = (element: HTMLElement) => {
				const toolbar = element.closest<HTMLElement>('[role="toolbar"]');
				return toolbar && node.contains(toolbar) ? toolbar : undefined;
			};

			// The row's focus target first, then its other controls in reading order. A toolbar is a single stop, since its own
			// arrow keys move inside it
			const getRowStops = (row: HTMLElement) => {
				const item = isFocusTarget(row) ? row : Array.from(row.querySelectorAll<HTMLElement>('*')).find(isFocusTarget);
				if (!item) return [];

				const stops: { element: HTMLElement; toolbar?: HTMLElement }[] = [{ element: item }];
				const walker = getFocusableTreeWalker(row, { tabbable: true });
				for (let control = walker.nextNode() as HTMLElement | null; control; control = walker.nextNode() as HTMLElement | null) {
					const toolbar = control === item ? undefined : toolbarOf(control);
					if (control === item || (toolbar && stops.some((stop) => stop.toolbar === toolbar))) continue;

					const remembered = toolbar && toolbarMemory.get(toolbar);
					stops.push({ element: remembered && toolbar.contains(remembered) ? remembered : control, toolbar });
				}
				return stops;
			};

			const findRowStops = (target: HTMLElement) => {
				const row = target.closest<HTMLElement>(rowSelector);
				if (!row || !node.contains(row)) return undefined;

				const stops = getRowStops(row);
				const toolbar = toolbarOf(target);
				const index = stops.findIndex((stop) => (toolbar ? stop.toolbar === toolbar : stop.element === target));
				return index === -1 ? undefined : { stops, index };
			};

			// Tab walks the focused row only, then leaves the list instead of entering the next row
			const tabThroughRow = (e: KeyboardEvent, target: HTMLElement) => {
				const found = findRowStops(target);
				const next = found?.stops[found.index + (e.shiftKey ? -1 : 1)];
				if (!next) {
					leaveList(e);
					return;
				}

				e.preventDefault();
				e.stopPropagation();
				next.element.focus();
			};

			const returnToRow = (e: KeyboardEvent, target: HTMLElement) => {
				const found = findRowStops(target);
				if (!found || found.index === 0) return;

				e.preventDefault();
				e.stopPropagation();
				found.stops[0].element.focus();
			};

			const onKeyDown = (e: Event) => {
				if (!(e instanceof KeyboardEvent) || !(e.target instanceof HTMLElement) || !node.contains(e.target) || isTextField(e.target)) {
					return;
				}

				if (e.key === 'Tab') {
					tabThroughRow(e, e.target);
					return;
				}

				if (e.key === 'Escape') {
					returnToRow(e, e.target);
					return;
				}

				if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && isItem(e.target)) {
					moveBetweenRows(e, e.target);
				}
			};

			const lastItemOfList = () => Array.from(node.querySelectorAll<HTMLElement>('*')).filter(isFocusTarget).pop();

			// Only keyboard focus counts: a click on a row does not change where the keyboard comes back to
			const onFocusIn = (e: FocusEvent) => {
				if (!(e.target instanceof HTMLElement)) return;

				const toolbar = toolbarOf(e.target);
				if (toolbar) toolbarMemory.set(toolbar, e.target);

				if (!e.target.matches(':focus-visible')) return;

				const enteredFromOutside = e.relatedTarget instanceof HTMLElement && !node.contains(e.relatedTarget);
				if (enteredFromOutside) {
					const rememberedItem = lastItem && node.contains(lastItem) ? lastItem : undefined;
					const entry = rememberedItem ?? (enterAtLast ? lastItemOfList() : findRowStops(e.target)?.stops[0].element);
					if (entry && entry !== e.target) {
						entry.focus();
						return;
					}
				}

				if (isItem(e.target)) {
					lastItem = e.target;
				}
			};

			// The document's capture phase runs before React's capture handlers at the app root, such as a toolbar's
			// `onKeyDownCapture`, so the list decides first how its rows handle these keys
			const doc = node.ownerDocument;
			doc.addEventListener('keydown', onKeyDown, { capture: true });
			node.addEventListener('focusin', onFocusIn);
			cleanupRef.current = () => {
				doc.removeEventListener('keydown', onKeyDown, { capture: true });
				node.removeEventListener('focusin', onFocusIn);
			};
		},
		[isItem, rowSelector, enterAtLast, onLeave],
	);
};
