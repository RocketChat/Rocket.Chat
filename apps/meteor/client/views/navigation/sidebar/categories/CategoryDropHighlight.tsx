import { Box } from '@rocket.chat/fuselage';
import type { RefObject } from 'react';
import { useLayoutEffect, useState } from 'react';

import { useDragOverGroup } from './CategoryDnDContext';

type HighlightRect = { top: number; height: number };

/**
 * A single rounded highlight rendered *behind* a category while a room is dragged over it, so the whole
 * category (its header + rooms, or the "drag rooms here" placeholder) reads as one continuous drop area
 * instead of separate per-row pills. It spans the union of the group's elements — each tagged with
 * `data-drop-group` — measured relative to the sidebar list container, and sits behind the (transparent)
 * rows so it fills the inset gaps between them while the rows' own tint covers the rest.
 */
const CategoryDropHighlight = ({ containerRef }: { containerRef: RefObject<HTMLElement | null> }) => {
	const dragOverGroup = useDragOverGroup();
	const [rect, setRect] = useState<HighlightRect | null>(null);

	useLayoutEffect(() => {
		const container = containerRef.current;
		if (!container || !dragOverGroup) {
			setRect(null);
			return;
		}

		const elements = container.querySelectorAll<HTMLElement>(`[data-drop-group="${CSS.escape(dragOverGroup)}"]`);
		if (!elements.length) {
			setRect(null);
			return;
		}

		const base = container.getBoundingClientRect();
		let top = Infinity;
		let bottom = -Infinity;
		elements.forEach((element) => {
			const box = element.getBoundingClientRect();
			top = Math.min(top, box.top);
			bottom = Math.max(bottom, box.bottom);
		});
		setRect({ top: top - base.top, height: bottom - top });
	}, [dragOverGroup, containerRef]);

	if (!rect) {
		return null;
	}

	return (
		<Box
			aria-hidden
			position='absolute'
			insetInlineStart='0.5rem'
			insetInlineEnd='0.5rem'
			style={{
				top: rect.top,
				height: rect.height,
				backgroundColor: 'var(--rcx-color-surface-hover)',
				borderRadius: 'var(--rcx-border-radius-medium, 0.25rem)',
				pointerEvents: 'none',
				// Sit behind the (transparent) rows; the isolated container keeps this above the sidebar surface.
				zIndex: -1,
			}}
		/>
	);
};

export default CategoryDropHighlight;
