import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { RefCallback } from 'react';
import { useCallback, useState } from 'react';

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
	onDrop: (source: ItemListDragSource, target: ItemListDropTarget) => void;
};

const DRAG_THRESHOLD = 4;
const EDGE_SIZE = 32;
const MAX_SCROLL_SPEED = 12;
const PREVIEW_OFFSET = 12;
const PREVIEW_MAX_WIDTH = 240;

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

const groupRect = (list: HTMLElement, group: string) => {
	const rects = Array.from(list.querySelectorAll(`[data-drag-group="${CSS.escape(group)}"]`), (element) =>
		element.getBoundingClientRect(),
	).filter((rect) => rect.height > 0);

	if (!rects.length) {
		return undefined;
	}

	return { top: Math.min(...rects.map((rect) => rect.top)), bottom: Math.max(...rects.map((rect) => rect.bottom)) };
};

/**
 * Lets the rows and groups of a list of rows be dragged with the pointer. Rows opt in with `data-drag-key`, `data-drag-kind` and
 * `data-drag-group`; the hook draws the lifted copy and the drop line or box, and the caller applies the change on drop.
 */
export const useItemListDrag = ({ disabled = false, dragHandle = 'none', canDrag, resolveTarget, onDrop }: ItemListDragOptions) => {
	const [source, setSource] = useState<ItemListDragSource>();

	const stableCanDrag = useStableCallback((source: ItemListDragSource) => canDrag?.(source) ?? true);
	const stableResolveTarget = useStableCallback(resolveTarget);
	const stableOnDrop = useStableCallback(onDrop);

	const ref: RefCallback<HTMLElement> = useCallback(
		(list: HTMLElement) => {
			if (disabled) {
				return;
			}

			const preventNativeDrag = (event: DragEvent) => event.preventDefault();

			const handlePointerDown = (event: PointerEvent) => {
				if (event.button !== 0 || event.pointerType === 'touch') {
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

				const startX = event.clientX;
				const startY = event.clientY;
				const scroller = findScroller(sourceElement);
				let pointerX = startX;
				let pointerY = startY;
				let preview: HTMLElement | undefined;
				let indicator: HTMLElement | undefined;
				let target: ItemListDropTarget | undefined;
				let frame = 0;

				const placeIndicator = () => {
					if (!indicator) {
						return;
					}

					const listRect = list.getBoundingClientRect();
					const scrollerRect = scroller.getBoundingClientRect();
					const rect =
						target?.key && target.position !== 'inside'
							? list.querySelector(`[data-drag-key="${CSS.escape(target.key)}"]`)?.getBoundingClientRect()
							: target && groupRect(list, target.group);

					if (!target || !rect) {
						indicator.hidden = true;
						return;
					}

					indicator.hidden = false;
					indicator.className = target.position === 'inside' ? 'rcx-item-drop-box' : 'rcx-item-drop-line';
					indicator.style.left = `${listRect.left}px`;
					indicator.style.width = `${listRect.width}px`;

					if (target.position === 'inside') {
						const top = Math.max(rect.top, scrollerRect.top);
						indicator.style.top = `${top}px`;
						indicator.style.height = `${Math.max(0, Math.min(rect.bottom, scrollerRect.bottom) - top)}px`;
						return;
					}

					const y = target.position === 'before' ? rect.top : rect.bottom;
					indicator.style.height = '';
					indicator.style.top = `${y}px`;
					indicator.hidden = y < scrollerRect.top || y > scrollerRect.bottom;
				};

				const updateTarget = () => {
					const hovered = document.elementFromPoint(pointerX, pointerY)?.closest('[data-drag-group]');
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

					document.body.style.cursor = 'grabbing';
					setSource(dragSource);
					frame = requestAnimationFrame(autoScroll);
				};

				const handlePointerMove = (event: PointerEvent) => {
					pointerX = event.clientX;
					pointerY = event.clientY;

					if (!preview) {
						if (Math.hypot(pointerX - startX, pointerY - startY) < DRAG_THRESHOLD) {
							return;
						}
						lift();
					}

					// The copy trails the pointer instead of sitting under it, so the row or group being aimed at stays visible.
					if (preview) {
						preview.style.transform = `translate(${pointerX + PREVIEW_OFFSET}px, ${pointerY + PREVIEW_OFFSET}px)`;
					}
					updateTarget();
				};

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
					window.removeEventListener('pointermove', handlePointerMove);
					window.removeEventListener('pointerup', handlePointerUp);
					window.removeEventListener('pointercancel', handlePointerCancel);
					window.removeEventListener('keydown', handleKeyDown, true);
					cancelAnimationFrame(frame);

					if (!preview) {
						return;
					}

					preview.remove();
					indicator?.remove();
					document.body.style.cursor = '';
					setSource(undefined);

					// After Escape the button is still down; its release would otherwise click the row or toggle the group.
					if (buttonReleased) {
						armClickSwallow();
					} else {
						window.addEventListener('pointerup', armClickSwallow, { capture: true, once: true });
					}

					if (drop && target) {
						stableOnDrop(dragSource, target);
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
			};

			list.addEventListener('pointerdown', handlePointerDown);
			list.addEventListener('dragstart', preventNativeDrag);

			return () => {
				list.removeEventListener('pointerdown', handlePointerDown);
				list.removeEventListener('dragstart', preventNativeDrag);
			};
		},
		[disabled, dragHandle, stableCanDrag, stableResolveTarget, stableOnDrop],
	);

	return { ref, source };
};
