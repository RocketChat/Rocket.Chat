import type { RefObject, CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';

import { useSafely } from '../useSafely';
import { useStableCallback } from '../useStableCallback';
import type { Placement } from './Placement';
import type { PlacementVariant } from './PlacementVariant';
import type { Position } from './Position';
import type { TargetBoundaries } from './getTargetBoundaries';
import { getTargetBoundaries } from './getTargetBoundaries';
import type { VariantBoundaries } from './getVariantBoundaries';
import { getVariantBoundaries } from './getVariantBoundaries';

export type { Placement } from './Placement';
export type { Position } from './Position';
export type { PlacementVariant } from './PlacementVariant';
export type { TargetBoundaries } from './getTargetBoundaries';
export type { VariantBoundaries } from './getVariantBoundaries';

export type UsePositionOptions = {
	margin?: number;
	/** The element the target must fit in; the viewport of the anchor's window when not given. */
	container?: Element;
	placement?: Placement;
};

export type UsePositionResult = {
	style: CSSProperties;
	placement?: Placement;
};

type TargetBoundariesKey = keyof TargetBoundaries;
type VariantBoundariesKey = keyof VariantBoundaries;
type VariantBoundariesKeyWithoutDirection = VariantBoundariesKey extends `${'h' | 'v'}${infer U}` ? U : never;

const fallbackOrder: Record<Position, TargetBoundariesKey[]> = {
	top: ['t', 'b', 'r', 'l'],
	bottom: ['b', 't', 'r', 'l'],
	right: ['r', 'l', 't', 'b'],
	left: ['l', 'r', 'b', 't'],
};

const fallbackOrderVariant: Record<PlacementVariant, VariantBoundariesKeyWithoutDirection[]> = {
	start: ['s', 'e', 'm'],
	middle: ['m', 's', 'e'],
	end: ['e', 's', 'm'],
};

const keysToPlacementMap: Record<TargetBoundariesKey, Position> & Record<VariantBoundariesKeyWithoutDirection, PlacementVariant> = {
	t: 'top',
	b: 'bottom',
	l: 'left',
	r: 'right',
	s: 'start',
	e: 'end',
	m: 'middle',
};

const emptyStyle: UsePositionResult = {
	style: {
		position: 'fixed',
		visibility: 'hidden',
	},
};

const splitPlacement = (placement: Placement) => {
	const [placementKey, variantKey = 'middle'] = placement.split('-');

	return [placementKey as Position, variantKey as PlacementVariant] as const;
};

export function getPositionStyle({
	placement,
	targetRect,
	containerRect,
	targetBoundaries,
	variantBoundaries,
	margin = 0,
}: {
	placement: Placement;
	targetRect: DOMRect;
	containerRect: DOMRect;
	targetBoundaries: TargetBoundaries;
	variantBoundaries: VariantBoundaries;
	margin?: number;
}): UsePositionResult {
	if (!targetBoundaries) {
		return emptyStyle;
	}

	const { top, left, bottom, right } = containerRect;

	const [position, placementVariant] = splitPlacement(placement);

	const placementAttempts = fallbackOrder[position];
	const variantsAttempts = fallbackOrderVariant[placementVariant];

	for (const placementAttempt of placementAttempts) {
		const directionVertical = ['t', 'b'].includes(placementAttempt);

		const [positionKey, variantKey] = directionVertical ? ['top', 'left'] : ['left', 'top'];

		const point = targetBoundaries[placementAttempt];

		const [positionBox, variantBox] = directionVertical ? [targetRect.height, targetRect.width] : [targetRect.width, targetRect.height];
		const [positionMaximum, variantMaximum] = directionVertical ? [bottom, right] : [right, bottom];
		const [positionMinimum, variantMinimum] = directionVertical ? [top, left] : [left, top];

		// if the point extrapolate the container boundaries
		if (point < positionMinimum || point + positionBox > positionMaximum) {
			continue;
		}

		for (const v of variantsAttempts) {
			// The position-value, the related size value of the popper and the limit
			const variantPoint = variantBoundaries[`${directionVertical ? 'v' : 'h'}${v}`];

			if (variantPoint < variantMinimum || variantPoint + variantBox > variantMaximum) {
				continue;
			}
			return {
				style: {
					[positionKey]: point,
					[variantKey]: variantPoint,
					position: 'fixed',
					zIndex: 999999,
					opacity: 1,
				},
				placement: `${keysToPlacementMap[placementAttempt]}-${keysToPlacementMap[v]}`,
			};
		}
	}

	const placementAttempt = placementAttempts[0];

	const directionVertical = ['t', 'b'].includes(placementAttempt);

	const variantPoint = variantBoundaries[`${directionVertical ? 'v' : 'h'}${variantsAttempts[0]}`];

	const [containerHeight, targetHeight] = directionVertical
		? [containerRect.height, targetRect.height]
		: [containerRect.width, targetRect.width];

	const referencePoint = directionVertical ? top : left;

	const point = (containerHeight - targetHeight) / 2 + referencePoint;

	return {
		style: {
			top: point,
			left: variantPoint,
			position: 'fixed',
			zIndex: 999999,
			...(bottom < targetRect.height + point && {
				bottom: margin,
				overflowY: 'auto',
			}),
		},
		placement: `${keysToPlacementMap[placementAttempt]}-${keysToPlacementMap[variantsAttempts[0]]}`,
	};
}

const getViewportRect = (view: Window) =>
	({
		x: 0,
		y: 0,
		top: 0,
		left: 0,
		right: view.innerWidth,
		bottom: view.innerHeight,
		width: view.innerWidth,
		height: view.innerHeight,
	}) as DOMRect;

const isSamePosition = (a: UsePositionResult, b: UsePositionResult) => {
	const keys = new Set([...Object.keys(a.style), ...Object.keys(b.style)] as (keyof UsePositionResult['style'])[]);

	return a.placement === b.placement && [...keys].every((key) => a.style[key] === b.style[key]);
};

// The fallback placement limits the target with `bottom`, which must not limit the size it is placed by.
const measureTarget = (target: Element) => {
	// Checked by shape, since a target in another window is not an instance of this window's element classes.
	if (!('style' in target)) {
		return target.getBoundingClientRect();
	}

	const { style } = target as Element & ElementCSSInlineStyle;
	const { bottom } = style;
	style.bottom = '';
	const rect = target.getBoundingClientRect();
	style.bottom = bottom;

	return rect;
};

/**
 * Hook to deal and position an element using an anchor.
 *
 * The position follows the anchor as the page or any of its scroll containers scrolls, and as the anchor, the target or
 * the window resizes, at most once per frame.
 *
 * @param anchorRef - the anchor
 * @param targetRef - the element to be positioned
 * @param options - options to position
 * @returns The style containing top and left position
 * @public
 */
export function usePosition<TTarget extends Element, TAnchor extends Element>(
	anchorRef: RefObject<TAnchor | null>,
	targetRef: RefObject<TTarget | null>,
	{ margin = 8, placement = 'bottom-start', container }: UsePositionOptions = {},
): UsePositionResult {
	const [style, setStyle] = useSafely(useState<UsePositionResult>(emptyStyle));
	const lastPositionRef = useRef(emptyStyle);

	const updatePosition = useStableCallback(() => {
		const target = targetRef.current;
		const anchor = anchorRef.current;
		const view = anchor?.ownerDocument.defaultView;

		if (!target || !anchor || !view) {
			return;
		}

		const targetRect = measureTarget(target);
		const anchorRect = anchor.getBoundingClientRect();

		const position = getPositionStyle({
			placement,
			containerRect: container ? container.getBoundingClientRect() : getViewportRect(view),
			targetBoundaries: getTargetBoundaries({ anchorRect, targetRect, margin }),
			variantBoundaries: getVariantBoundaries({ anchorRect, targetRect }),
			targetRect,
			margin,
		});

		// Most scrolls and resizes leave the target where it is, and those must not render it again.
		if (isSamePosition(position, lastPositionRef.current)) {
			return;
		}

		lastPositionRef.current = position;
		setStyle(position);
	});

	useEffect(() => {
		const anchor = anchorRef.current;
		const target = targetRef.current;
		const view = anchor?.ownerDocument.defaultView;

		if (!anchor || !target || !view) {
			return;
		}

		let frame = 0;

		const scheduleUpdate = () => {
			view.cancelAnimationFrame(frame);
			frame = view.requestAnimationFrame(updatePosition);
		};

		// The first placement waits for the frame in which the target's content has rendered, so it is measured once, at its size.
		scheduleUpdate();

		const observer = new ResizeObserver(scheduleUpdate);
		observer.observe(anchor);
		observer.observe(target);

		if (container) {
			observer.observe(container);
		}

		view.addEventListener('scroll', scheduleUpdate, { capture: true, passive: true });
		view.addEventListener('resize', scheduleUpdate);

		return () => {
			view.cancelAnimationFrame(frame);
			observer.disconnect();
			view.removeEventListener('scroll', scheduleUpdate, { capture: true });
			view.removeEventListener('resize', scheduleUpdate);
		};
	}, [anchorRef, targetRef, container, margin, placement, updatePosition]);

	return style;
}
