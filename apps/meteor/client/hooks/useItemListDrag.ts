import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { RefCallback } from 'react';
import { useCallback, useState } from 'react';

import { isMoveRowShortcut } from './useItemListNavigation';

export type ItemListDragKind = 'item' | 'group';

export type ItemListDragSource = {
	key: string;
	kind: ItemListDragKind;
	group: string;
};

export type ItemListDropTarget = {
	group: string;
	/**
	 * The row the line is drawn against. Without it, `before` and `after` refer to the whole group.
	 */
	key?: string;
	position: 'before' | 'after' | 'inside';
};

export type ItemListDropHover = {
	group: string;
	key: string;
	kind: ItemListDragKind;
	/**
	 * The half of the hovered row, or of the whole group while a group is dragged, the pointer is on.
	 */
	half: 'top' | 'bottom';
};

type ItemListDragOptions = {
	disabled?: boolean;
	/**
	 * `none` lets the whole row start a drag; `trailing` only its `ItemDragHandle`.
	 */
	dragHandle?: 'none' | 'trailing';
	canDrag?: (source: ItemListDragSource) => boolean;
	resolveTarget: (source: ItemListDragSource, hover: ItemListDropHover) => ItemListDropTarget | undefined;
	onDrop: (source: ItemListDragSource, target: ItemListDropTarget) => Promise<unknown> | void;
	/**
	 * Tells which rows the keyboard can move, so only those advertise the shortcut. Defaults to every row `onMove` is given for.
	 */
	canMove?: (source: ItemListDragSource) => boolean;
	/**
	 * Moves the focused row one step with Cmd+Shift (Ctrl+Shift) and the up or down arrow. Resolves with what to announce.
	 */
	onMove?: (source: ItemListDragSource, direction: 'up' | 'down') => Promise<string | undefined> | string | undefined;
};

const DRAG_THRESHOLD = 4;
const TOUCH_SLOP = 8;
const TOUCH_HOLD_MS = 300;
const EDGE_SIZE = 32;
const MAX_SCROLL_SPEED = 12;
const PREVIEW_OFFSET = 12;
const PREVIEW_MAX_WIDTH = 240;
const LANDING_TIMEOUT_MS = 1500;
const MOVE_SHORTCUTS = 'Meta+Shift+ArrowUp Meta+Shift+ArrowDown Control+Shift+ArrowUp Control+Shift+ArrowDown';

const findScroller = (element: Element) => {
	for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
		const { overflowY } = getComputedStyle(ancestor);
		if (overflowY === 'auto' || overflowY === 'scroll') {
			return ancestor;
		}
	}
	return document.scrollingElement as HTMLElement;
};

const readSource = (element: Element): ItemListDragSource | undefined => {
	const { dragKey, dragKind, dragGroup } = (element as HTMLElement).dataset;
	if (!dragKey || !dragGroup || (dragKind !== 'item' && dragKind !== 'group')) {
		return undefined;
	}
	return { key: dragKey, kind: dragKind, group: dragGroup };
};

const findRow = (list: HTMLElement, key: string) => list.querySelector<HTMLElement>(`[data-drag-key="${CSS.escape(key)}"]`);

const groupRect = (list: HTMLElement, group: string) => {
	const rects = Array.from(list.querySelectorAll(`[data-drag-group="${CSS.escape(group)}"]`), (element) =>
		element.getBoundingClientRect(),
	).filter((rect) => rect.height > 0);

	if (!rects.length) {
		return undefined;
	}

	return { top: Math.min(...rects.map((rect) => rect.top)), bottom: Math.max(...rects.map((rect) => rect.bottom)) };
};

const placeBox = (box: HTMLElement, list: HTMLElement, scroller: HTMLElement, rect: { top: number; bottom: number } | undefined) => {
	const scrollerRect = scroller.getBoundingClientRect();
	const top = rect && Math.max(rect.top, scrollerRect.top);
	const height = rect && top !== undefined ? Math.min(rect.bottom, scrollerRect.bottom) - top : 0;

	box.hidden = !rect || height <= 0;
	if (box.hidden || top === undefined) {
		return;
	}

	const listRect = list.getBoundingClientRect();
	box.style.left = `${listRect.left}px`;
	box.style.width = `${listRect.width}px`;
	box.style.top = `${top}px`;
	box.style.height = `${height}px`;
};

// Flashes the row once it shows up away from where it was, so the eye finds where it landed.
const flashWhenLanded = (list: HTMLElement, key: string, fromTop: number | undefined) => {
	const deadline = performance.now() + LANDING_TIMEOUT_MS;

	const check = () => {
		const row = findRow(list, key);
		const top = row?.getBoundingClientRect().top;
		if (row && top !== undefined && (fromTop === undefined || Math.abs(top - fromTop) > 1)) {
			const surface = row.matches('.rcx-item, .rcx-item-group-header')
				? row
				: (row.querySelector<HTMLElement>('.rcx-item, .rcx-item-group-header') ?? row);
			surface.classList.add('rcx-item--dropped');
			setTimeout(() => surface.classList.remove('rcx-item--dropped'), 700);
			return;
		}
		if (performance.now() < deadline) {
			requestAnimationFrame(check);
		}
	};

	requestAnimationFrame(check);
};

/**
 * Lets the rows and groups of a list of rows be dragged with the pointer, held and dragged on touch, and moved one step with the
 * keyboard. Rows opt in with `data-drag-key`, `data-drag-kind` and `data-drag-group`; the hook draws the lifted copy, the drop line or
 * box and the targets a row can go into, and the caller applies the change on drop.
 */
export const useItemListDrag = ({
	disabled = false,
	dragHandle = 'none',
	canDrag,
	resolveTarget,
	onDrop,
	canMove,
	onMove,
}: ItemListDragOptions) => {
	const [source, setSource] = useState<ItemListDragSource>();

	const stableCanDrag = useStableCallback((source: ItemListDragSource) => canDrag?.(source) ?? true);
	const stableCanMove = useStableCallback((source: ItemListDragSource) => !!onMove && stableCanDrag(source) && (canMove?.(source) ?? true));
	const stableResolveTarget = useStableCallback(resolveTarget);
	const stableOnDrop = useStableCallback(onDrop);
	const stableOnMove = useStableCallback((source: ItemListDragSource, direction: 'up' | 'down') => onMove?.(source, direction));

	const ref: RefCallback<HTMLElement> = useCallback(
		(list: HTMLElement) => {
			if (disabled) {
				return;
			}

			const preventNativeDrag = (event: DragEvent) => event.preventDefault();

			const handlePointerDown = (event: PointerEvent) => {
				if (event.button !== 0) {
					return;
				}

				const start = event.target as Element;
				if (dragHandle === 'trailing' && !start.closest('.rcx-item__drag-handle')) {
					return;
				}

				const sourceElement = start.closest('[data-drag-key]');
				const dragSource = sourceElement && readSource(sourceElement);
				if (!sourceElement || !dragSource || !list.contains(sourceElement) || !stableCanDrag(dragSource)) {
					return;
				}

				const isTouch = event.pointerType === 'touch';
				const startX = event.clientX;
				const startY = event.clientY;
				const scroller = findScroller(sourceElement);
				let pointerX = startX;
				let pointerY = startY;
				let preview: HTMLElement | undefined;
				let indicator: HTMLElement | undefined;
				let shield: HTMLElement | undefined;
				let available: { group: string; box: HTMLElement }[] = [];
				let target: ItemListDropTarget | undefined;
				let frame = 0;
				let holdTimer: ReturnType<typeof setTimeout> | undefined;

				const placeIndicator = () => {
					if (!indicator) {
						return;
					}

					shield?.classList.toggle('rcx-item-drag-shield--no-drop', !target);

					for (const { group, box } of available) {
						placeBox(box, list, scroller, target?.position === 'inside' && target.group === group ? undefined : groupRect(list, group));
					}

					if (!target) {
						indicator.hidden = true;
						return;
					}

					if (target.position === 'inside') {
						indicator.className = 'rcx-item-drop-box';
						placeBox(indicator, list, scroller, groupRect(list, target.group));
						return;
					}

					const rect = target.key ? findRow(list, target.key)?.getBoundingClientRect() : groupRect(list, target.group);
					if (!rect) {
						indicator.hidden = true;
						return;
					}

					const listRect = list.getBoundingClientRect();
					const scrollerRect = scroller.getBoundingClientRect();
					const y = target.position === 'before' ? rect.top : rect.bottom;
					indicator.className = 'rcx-item-drop-line';
					indicator.style.left = `${listRect.left}px`;
					indicator.style.width = `${listRect.width}px`;
					indicator.style.height = '';
					indicator.style.top = `${y}px`;
					indicator.hidden = y < scrollerRect.top || y > scrollerRect.bottom;
				};

				const updateTarget = () => {
					const hovered = document
						.elementsFromPoint(pointerX, pointerY)
						.find((element) => element !== shield)
						?.closest('[data-drag-group]');
					const hover = hovered && list.contains(hovered) ? readSource(hovered) : undefined;

					if (!hover) {
						target = undefined;
						placeIndicator();
						return;
					}

					const rect = dragSource.kind === 'group' ? groupRect(list, hover.group) : hovered?.getBoundingClientRect();
					const half = rect && pointerY > (rect.top + rect.bottom) / 2 ? 'bottom' : 'top';
					target = stableResolveTarget(dragSource, { ...hover, half });
					placeIndicator();
				};

				const autoScroll = () => {
					const rect = scroller.getBoundingClientRect();
					const distance =
						pointerY < rect.top + EDGE_SIZE ? pointerY - rect.top - EDGE_SIZE : pointerY > rect.bottom - EDGE_SIZE ? pointerY - rect.bottom + EDGE_SIZE : 0;

					if (distance) {
						scroller.scrollTop += Math.max(-MAX_SCROLL_SPEED, Math.min(MAX_SCROLL_SPEED, distance / 2));
						updateTarget();
					}

					frame = requestAnimationFrame(autoScroll);
				};

				// The groups a dragged row can go into are outlined from the start, so the places to aim at are visible before hovering.
				const markAvailableGroups = () => {
					const groups = new Set(Array.from(list.querySelectorAll<HTMLElement>('[data-drag-group]'), (element) => element.dataset.dragGroup!));
					available = Array.from(groups)
						.filter((group) => stableResolveTarget(dragSource, { group, key: group, kind: 'group', half: 'top' })?.position === 'inside')
						.map((group) => {
							const box = document.createElement('div');
							box.className = 'rcx-item-drop-box rcx-item-drop-box--available';
							box.hidden = true;
							document.body.append(box);
							return { group, box };
						});
				};

				const movePreview = () => {
					// The copy trails the pointer instead of sitting under it, so the row or group being aimed at stays visible.
					if (preview) {
						preview.style.transform = `translate(${pointerX + PREVIEW_OFFSET}px, ${pointerY + PREVIEW_OFFSET}px)`;
					}
				};

				const lift = () => {
					preview = sourceElement.cloneNode(true) as HTMLElement;
					preview.removeAttribute('id');
					preview.setAttribute('aria-hidden', 'true');
					preview.classList.add('rcx-item-drag-preview');
					preview.style.width = `${Math.min(sourceElement.getBoundingClientRect().width, PREVIEW_MAX_WIDTH)}px`;
					document.body.append(preview);

					indicator = document.createElement('div');
					indicator.hidden = true;
					document.body.append(indicator);

					// The page under the shield sees no pointer while dragging: no hover, no tooltips, one cursor.
					shield = document.createElement('div');
					shield.className = 'rcx-item-drag-shield';
					shield.addEventListener(
						'wheel',
						(event) => {
							scroller.scrollTop += event.deltaY;
							updateTarget();
						},
						{ passive: true },
					);
					document.body.append(shield);

					if (dragSource.kind === 'item') {
						markAvailableGroups();
					}

					setSource(dragSource);
					movePreview();
					updateTarget();
					frame = requestAnimationFrame(autoScroll);
				};

				const handlePointerMove = (event: PointerEvent) => {
					pointerX = event.clientX;
					pointerY = event.clientY;

					if (!preview) {
						const distance = Math.hypot(pointerX - startX, pointerY - startY);

						// On touch, moving before the hold ends is a scroll, not a drag.
						if (isTouch) {
							if (distance > TOUCH_SLOP) {
								finish(false);
							}
							return;
						}

						if (distance < DRAG_THRESHOLD) {
							return;
						}
						lift();
					}

					movePreview();
					updateTarget();
				};

				// Once a touch drag has started, the finger moves the row instead of scrolling the page.
				const preventTouchScroll = (event: TouchEvent) => {
					if (preview) {
						event.preventDefault();
					}
				};

				const preventContextMenu = (event: Event) => event.preventDefault();

				// A drag ends with a click on the row it started from; that click must not open the row.
				const swallowClick = (event: MouseEvent) => {
					event.preventDefault();
					event.stopPropagation();
				};

				const armClickSwallow = () => {
					window.addEventListener('click', swallowClick, { capture: true, once: true });
					setTimeout(() => window.removeEventListener('click', swallowClick, { capture: true }));
				};

				const finish = (drop: boolean, buttonReleased = true) => {
					clearTimeout(holdTimer);
					window.removeEventListener('pointermove', handlePointerMove);
					window.removeEventListener('pointerup', handlePointerUp);
					window.removeEventListener('pointercancel', handlePointerCancel);
					window.removeEventListener('keydown', handleKeyDown, true);
					window.removeEventListener('touchmove', preventTouchScroll);
					window.removeEventListener('contextmenu', preventContextMenu, true);
					cancelAnimationFrame(frame);

					if (!preview) {
						return;
					}

					const sourceTop = sourceElement.isConnected ? sourceElement.getBoundingClientRect().top : undefined;

					preview.remove();
					indicator?.remove();
					shield?.remove();
					available.forEach(({ box }) => box.remove());
					setSource(undefined);

					// After Escape the button is still down; its release would otherwise click the row or toggle the group.
					if (buttonReleased) {
						armClickSwallow();
					} else {
						window.addEventListener('pointerup', armClickSwallow, { capture: true, once: true });
					}

					if (drop && target) {
						void Promise.resolve(stableOnDrop(dragSource, target)).then(
							() => flashWhenLanded(list, dragSource.key, sourceTop),
							() => undefined,
						);
					}
				};

				const handlePointerUp = () => finish(true);
				const handlePointerCancel = () => finish(false);
				const handleKeyDown = (event: KeyboardEvent) => {
					if (event.key === 'Escape' && preview) {
						event.preventDefault();
						event.stopPropagation();
						finish(false, false);
					}
				};

				window.addEventListener('pointermove', handlePointerMove);
				window.addEventListener('pointerup', handlePointerUp);
				window.addEventListener('pointercancel', handlePointerCancel);
				window.addEventListener('keydown', handleKeyDown, true);

				if (isTouch) {
					window.addEventListener('touchmove', preventTouchScroll, { passive: false });
					window.addEventListener('contextmenu', preventContextMenu, true);
					holdTimer = setTimeout(lift, TOUCH_HOLD_MS);
				}
			};

			const announcer = document.createElement('div');
			announcer.className = 'rcx-item-drag-announcer';
			announcer.setAttribute('role', 'status');
			announcer.setAttribute('aria-live', 'polite');
			document.body.append(announcer);

			// Only the rows the keyboard can move advertise the shortcut to assistive technologies.
			const handleFocusIn = (event: FocusEvent) => {
				if (!(event.target instanceof HTMLElement) || event.target.hasAttribute('aria-keyshortcuts')) {
					return;
				}
				const row = event.target.closest('[data-drag-key]');
				const dragSource = row && list.contains(row) ? readSource(row) : undefined;
				if (dragSource && stableCanMove(dragSource)) {
					event.target.setAttribute('aria-keyshortcuts', MOVE_SHORTCUTS);
				}
			};

			const handleKeyDown = async (event: KeyboardEvent) => {
				if (!isMoveRowShortcut(event) || !(event.target instanceof HTMLElement)) {
					return;
				}

				const sourceElement = event.target.closest('[data-drag-key]');
				const dragSource = sourceElement && readSource(sourceElement);
				if (!sourceElement || !dragSource || !list.contains(sourceElement) || !stableCanMove(dragSource)) {
					return;
				}

				event.preventDefault();
				event.stopPropagation();

				const focused = event.target;
				const sourceTop = sourceElement.getBoundingClientRect().top;
				const message = await stableOnMove(dragSource, event.key === 'ArrowUp' ? 'up' : 'down');

				// Reordering detaches or remounts the row, which drops its focus; give it back to the same control once it lands.
				const focusedClass = focused.classList[0];
				const findFocused = () => {
					if (focused.isConnected) {
						return focused;
					}
					return focusedClass ? findRow(list, dragSource.key)?.querySelector<HTMLElement>(`.${CSS.escape(focusedClass)}`) : undefined;
				};

				const deadline = performance.now() + LANDING_TIMEOUT_MS;
				const refocus = () => {
					const active = document.activeElement;
					const target = findFocused();
					if (active && active !== document.body && active !== target) {
						return;
					}
					if (target && active !== target) {
						target.focus();
					}
					if (performance.now() < deadline) {
						requestAnimationFrame(refocus);
					}
				};
				requestAnimationFrame(refocus);
				flashWhenLanded(list, dragSource.key, sourceTop);

				if (message) {
					announcer.textContent = message;
				}
			};

			list.addEventListener('pointerdown', handlePointerDown);
			list.addEventListener('dragstart', preventNativeDrag);
			list.addEventListener('keydown', handleKeyDown);
			list.addEventListener('focusin', handleFocusIn);

			return () => {
				list.removeEventListener('pointerdown', handlePointerDown);
				list.removeEventListener('dragstart', preventNativeDrag);
				list.removeEventListener('keydown', handleKeyDown);
				list.removeEventListener('focusin', handleFocusIn);
				announcer.remove();
			};
		},
		[disabled, dragHandle, stableCanDrag, stableCanMove, stableResolveTarget, stableOnDrop, stableOnMove],
	);

	return { ref, source };
};
