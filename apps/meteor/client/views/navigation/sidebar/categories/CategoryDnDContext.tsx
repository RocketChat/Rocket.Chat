import type { DragEvent, ReactNode } from 'react';
import { createContext, useContext, useMemo, useRef, useState } from 'react';

import type { MovableRoom } from '../../hooks/useCustomCategories';
import { useCustomCategories } from '../../hooks/useCustomCategories';

type DraggingRoom = MovableRoom & {
	/** The room's current group (custom category id or system key). */
	fromGroup?: string;
	/** The system group the room returns to when removed from a custom category. */
	nativeKey?: string;
};

type CategoryDnDContextValue = {
	draggingRoom: DraggingRoom | null;
	dragOverGroup: string | null;
	startDrag: (room: DraggingRoom) => void;
	endDrag: () => void;
	setDragOverGroup: (key: string | null) => void;
	/** Debounced clear, so moving between rows of the same group doesn't flicker. */
	clearDragOverGroup: () => void;
	dropOnGroup: (groupKey: string, isCustom: boolean) => void;
};

const CategoryDnDContext = createContext<CategoryDnDContextValue | undefined>(undefined);

export const CategoryDnDProvider = ({ children }: { children: ReactNode }) => {
	const { moveRoom, removeRoom } = useCustomCategories();
	const [draggingRoom, setDraggingRoom] = useState<DraggingRoom | null>(null);
	const [dragOverGroup, setDragOverGroupState] = useState<string | null>(null);
	const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	const value = useMemo<CategoryDnDContextValue>(() => {
		const cancelClear = () => {
			if (clearTimer.current) {
				clearTimeout(clearTimer.current);
				clearTimer.current = undefined;
			}
		};

		return {
			draggingRoom,
			dragOverGroup,
			startDrag: (room) => setDraggingRoom(room),
			endDrag: () => {
				cancelClear();
				setDraggingRoom(null);
				setDragOverGroupState(null);
			},
			setDragOverGroup: (key) => {
				cancelClear();
				setDragOverGroupState(key);
			},
			clearDragOverGroup: () => {
				cancelClear();
				clearTimer.current = setTimeout(() => setDragOverGroupState(null), 60);
			},
			dropOnGroup: (groupKey, isCustom) => {
				cancelClear();
				if (draggingRoom && draggingRoom.fromGroup !== groupKey) {
					const room = { rid: draggingRoom.rid, name: draggingRoom.name, isFavorite: draggingRoom.isFavorite };
					if (isCustom) {
						void moveRoom(room, groupKey);
					} else if (draggingRoom.nativeKey === groupKey) {
						// Dropping on the room's native system category removes it from its custom category.
						void removeRoom(room);
					}
				}
				setDraggingRoom(null);
				setDragOverGroupState(null);
			},
		};
	}, [draggingRoom, dragOverGroup, moveRoom, removeRoom]);

	return <CategoryDnDContext.Provider value={value}>{children}</CategoryDnDContext.Provider>;
};

const useCategoryDnD = () => useContext(CategoryDnDContext);

/** The group key currently being dragged over (always an accepting group), or null. */
export const useDragOverGroup = (): string | null => useCategoryDnD()?.dragOverGroup ?? null;

// A 1×1 transparent GIF used to suppress the browser's native drag image.
const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * Renders a tilted "picked up card" that follows the cursor for the whole drag, and returns a cleanup.
 *
 * We can't tilt via `setDragImage`: Chrome rasterizes that bitmap *without* applying CSS transforms, so
 * the rotation is silently dropped. Instead we hide the native drag image and animate our own live DOM
 * node — appended inside the sidebar so it inherits the sidebar's theme variables (correct colors).
 */
const createDragGhost = (node: HTMLElement, startX: number, startY: number): (() => void) => {
	const { width } = node.getBoundingClientRect();
	const ghost = node.cloneNode(true) as HTMLElement;
	const transformAt = (x: number, y: number) => `translate3d(${x - 16}px, ${y - 12}px, 0) rotate(1.25deg)`;

	Object.assign(ghost.style, {
		position: 'fixed',
		insetBlockStart: '0',
		insetInlineStart: '0',
		width: `${width}px`,
		margin: '0',
		zIndex: '9999',
		opacity: '0.95',
		pointerEvents: 'none',
		transform: transformAt(startX, startY),
		borderRadius: '4px',
		border: '2px solid var(--rcx-color-stroke-highlight, #095ad2)',
		boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
		backgroundColor: 'var(--rcx-sidebar-color-surface-default, var(--rcx-color-surface-light, #fff))',
	} satisfies Partial<CSSStyleDeclaration>);

	const container = node.closest('.rcx-sidebar') ?? document.body;
	container.appendChild(ghost);

	const move = (event: globalThis.DragEvent) => {
		// The browser fires a final drag event with 0,0 coordinates as the drag ends — ignore it so the
		// ghost doesn't jump to the corner on its way out.
		if (event.clientX === 0 && event.clientY === 0) {
			return;
		}
		ghost.style.transform = transformAt(event.clientX, event.clientY);
	};
	document.addEventListener('dragover', move);

	return () => {
		document.removeEventListener('dragover', move);
		ghost.remove();
	};
};

/** Drag handle props for a sidebar room row. */
export const useRoomDrag = (room: DraggingRoom) => {
	const dnd = useCategoryDnD();
	const cleanupGhost = useRef<(() => void) | undefined>(undefined);

	const isDragging = dnd?.draggingRoom?.rid === room.rid;

	if (!dnd) {
		return { isDragging: false };
	}

	return {
		isDragging,
		draggable: true,
		onDragStart: (event: DragEvent) => {
			// Room rows are <a href> links; the browser would otherwise attach the room URL
			// (text/uri-list) to the drag, triggering Chrome's "open link / split view" drop zones.
			event.dataTransfer.clearData();
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('application/x-rocketchat-room', room.rid);

			// Hide the native drag image; createDragGhost renders our own tilted, cursor-following ghost.
			const transparent = new Image();
			transparent.src = TRANSPARENT_PIXEL;
			event.dataTransfer.setDragImage(transparent, 0, 0);

			cleanupGhost.current = createDragGhost(event.currentTarget as HTMLElement, event.clientX, event.clientY);

			dnd.startDrag(room);
		},
		onDragEnd: () => {
			cleanupGhost.current?.();
			cleanupGhost.current = undefined;
			dnd.endDrag();
		},
	};
};

/**
 * Drop-target state for a sidebar group while a room is being dragged.
 * - Custom categories accept any room not already in them.
 * - A system category accepts a room only when it is that room's native category (drop = return to native).
 * - Non-accepting system categories are faded out to signal they don't accept the drop.
 */
export const useGroupDrop = (groupKey: string | undefined, isCustom: boolean) => {
	const dnd = useCategoryDnD();
	const dragging = dnd?.draggingRoom ?? null;

	const accepts = (() => {
		if (!dragging || !groupKey || dragging.fromGroup === groupKey) {
			return false;
		}
		return isCustom || dragging.nativeKey === groupKey;
	})();

	const isDragOver = accepts && dnd?.dragOverGroup === groupKey;
	const isFadedOut = Boolean(dragging) && !isCustom && Boolean(groupKey) && !accepts;

	if (!dnd || !accepts || !groupKey) {
		return { isDragOver: false, isFadedOut, dropProps: {} };
	}

	return {
		isDragOver,
		isFadedOut,
		dropProps: {
			onDragEnter: (event: DragEvent) => {
				event.preventDefault();
				dnd.setDragOverGroup(groupKey);
			},
			onDragOver: (event: DragEvent) => {
				event.preventDefault();
				event.dataTransfer.dropEffect = 'move';
				// Always re-assert: this cancels a pending clear scheduled by leaving a sibling row of the
				// same group, so moving within a section doesn't flicker. Setting the same value is a no-op render.
				dnd.setDragOverGroup(groupKey);
			},
			onDragLeave: () => dnd.clearDragOverGroup(),
			onDrop: (event: DragEvent) => {
				event.preventDefault();
				dnd.dropOnGroup(groupKey, isCustom);
			},
		},
	};
};
