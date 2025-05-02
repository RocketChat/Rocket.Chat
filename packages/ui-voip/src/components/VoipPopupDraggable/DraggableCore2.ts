import { Emitter, OffCallbackHandler } from '@rocket.chat/emitter';
import { useSafeRefCallback } from '@rocket.chat/ui-client';
import { useCallback, useEffect, useRef } from 'react';

const GRAB_DOM_EVENTS = ['pointerdown' /* , 'touchstart' */] as const;
const RELEASE_DOM_EVENTS = ['pointerup', 'pointercancel', 'lostpointercapture'] as const;
const MOVE_DOM_EVENTS = ['pointermove' /* , 'touchmove' */] as const;

interface PointCoordinates {
	x: number;
	y: number;
}

interface GenericRect extends PointCoordinates {
	width: number;
	height: number;
}

type DraggableElementEvents = {
	grab: GenericRect;
	move: PointCoordinates;
	release: GenericRect;
};

class DraggableElement extends Emitter<DraggableElementEvents> {
	private isDragging = false;

	private pointerCoordinates: PointCoordinates = { x: 0, y: 0 };

	private elementPositionOffset: PointCoordinates = { x: 0, y: 0 };

	private lastKnownElementPosition: GenericRect = { x: 0, y: 0, width: 0, height: 0 };

	private setPointerCoordinates(mouseOffset: PointCoordinates): void {
		this.pointerCoordinates = mouseOffset;
	}

	private addElementPositionOffset(x: number, y: number): void {
		const currentOffset = this.getCurrentOffset();
		this.setElementPositionOffset(currentOffset.x + x, currentOffset.y + y);
	}

	private setElementPositionOffset(x: number, y: number): void {
		this.elementPositionOffset = { x, y };
	}

	public setLastKnownElementPosition(rect: GenericRect): void {
		console.log('setLastKnownElementPosition', rect);
		this.lastKnownElementPosition = rect;
	}

	public getLastKnownElementPosition(): GenericRect {
		console.log('getLastKnownElementPosition', this.lastKnownElementPosition);
		return this.lastKnownElementPosition;
	}

	public moveToCoordinates(startingElementCoordinates: PointCoordinates, targetElementCoordinates: PointCoordinates): void {
		this.moveByOffset({
			x: targetElementCoordinates.x - startingElementCoordinates.x,
			y: targetElementCoordinates.y - startingElementCoordinates.y,
		});
	}

	public moveToLastKnownPosition(startingElementCoordinates: PointCoordinates): void {
		this.moveToCoordinates(startingElementCoordinates, this.getLastKnownElementPosition());
	}

	public handleGrab(startingPointerCoordinates: PointCoordinates, startingElementPosition: GenericRect): void {
		this.isDragging = true;
		this.setPointerCoordinates(startingPointerCoordinates);
		this.emit('grab', startingElementPosition);
	}

	public handleMove(currentPointerCoordinates: PointCoordinates): void {
		if (!this.isDragging) return;

		const xDelta = currentPointerCoordinates.x - this.pointerCoordinates.x;
		const yDelta = currentPointerCoordinates.y - this.pointerCoordinates.y;

		this.emit('move', this.getCurrentOffset());

		this.addElementPositionOffset(xDelta, yDelta);
		this.setPointerCoordinates(currentPointerCoordinates);
		console.log('moveHandle inside DraggableElement last', currentPointerCoordinates);
	}

	public handleRelease(finalElementPosition: GenericRect): void {
		this.isDragging = false;
		this.setPointerCoordinates({ x: 0, y: 0 });
		this.emit('release', finalElementPosition);
	}

	public moveByOffset(offset: PointCoordinates): void {
		this.addElementPositionOffset(offset.x, offset.y);
		this.emit('move', this.getCurrentOffset());
	}

	public getCurrentOffset(): { x: number; y: number } {
		return this.elementPositionOffset;
	}
}

class BoundingElement extends Emitter<{
	resize: GenericRect;
}> {
	private lastKnownBounds: GenericRect = { x: 0, y: 0, width: 0, height: 0 };

	// private timeout: NodeJS.Timeout | null = null;

	public setLastKnownBounds(rect: GenericRect): void {
		this.lastKnownBounds = rect;
	}

	public getLastKnownBounds(): GenericRect {
		return this.lastKnownBounds;
	}

	public resize(rect: GenericRect): void {
		this.setLastKnownBounds(rect);
		this.emit('resize', rect);
	}

	public onResize(cb: (rect: GenericRect) => void): OffCallbackHandler {
		return this.on('resize', cb);
	}
}

class HandleElement extends Emitter<{
	grab: PointCoordinates;
}> {
	constructor() {
		super();
	}

	public handleGrab(mousePosition: PointCoordinates): void {
		this.emit('grab', mousePosition);
	}

	public onGrab(cb: (mousePosition: PointCoordinates) => void): OffCallbackHandler {
		return this.on('grab', cb);
	}
}

const inferDOMRectFromGenericRect = (rect: GenericRect): DOMRect => {
	return new DOMRect(rect.x, rect.y, rect.width, rect.height);
};

function calculateBoundsOffset(draggableElement: GenericRect, bounds: GenericRect): PointCoordinates {
	const draggableRect = inferDOMRectFromGenericRect(draggableElement);
	const boundsRect = inferDOMRectFromGenericRect(bounds);

	// If the draggable element's top/left position is less than
	// the bounding element's top/left position, the difference will be positive
	// This means we can just add this value to the draggable element's offset
	// to bring it back into bounds
	const topLeftPoint = {
		x: boundsRect.left - draggableRect.left,
		y: boundsRect.top - draggableRect.top,
	};

	// If the draggable element's bottom/right position is greater than
	// the bounding element's bottom/right position, the difference will be negative
	// This means we can just add this value to the draggable element's offset
	// to bring it back into bounds
	const bottomRightPoint = {
		x: boundsRect.right - draggableRect.right,
		y: boundsRect.bottom - draggableRect.bottom,
	};

	const offset = {
		x: 0,
		y: 0,
	};

	// console.log('topLeftPoint', topLeftPoint);
	// console.log('bottomRightPoint', bottomRightPoint);

	if (topLeftPoint.x > 0) {
		offset.x += topLeftPoint.x;
	}
	if (topLeftPoint.y > 0) {
		offset.y += topLeftPoint.y;
	}
	if (bottomRightPoint.x < 0) {
		offset.x += bottomRightPoint.x;
	}
	if (bottomRightPoint.y < 0) {
		offset.y += bottomRightPoint.y;
	}

	// console.log('offset', offset);

	return offset;
}

const getPointerEventCoordinates = (e: PointerEvent): PointCoordinates => ({
	x: e.clientX,
	y: e.clientY,
});

export const useDraggable = () => {
	const draggableElementRef = useRef<DraggableElement>(new DraggableElement());
	const boundingElementRef = useRef<BoundingElement>(new BoundingElement());
	const handleElementRef = useRef<HandleElement>(new HandleElement());
	// const restorePositionRef = useRef<GenericRect | null>(null);

	const handleElementCallbackRef = useSafeRefCallback(
		useCallback((node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			const onGrab = (event: PointerEvent) => {
				handleElementRef.current.handleGrab(getPointerEventCoordinates(event));
			};

			const unsubArray = GRAB_DOM_EVENTS.map((event) => {
				node.addEventListener(event, onGrab);
				return () => node.removeEventListener(event, onGrab);
			});

			return () => unsubArray.forEach((unsub) => unsub());
		}, []),
	);

	const draggableCallbackRef = useSafeRefCallback(
		useCallback((node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			const unsubArray: OffCallbackHandler[] = [];

			const onMove = (event: PointerEvent) => {
				console.log('onMove', event);
				draggableElementRef.current.handleMove(getPointerEventCoordinates(event));
			};

			const onEnd = () => {
				draggableElementRef.current.handleRelease(node.getBoundingClientRect());
			};

			// Attach MOVE DOM listeners
			unsubArray.push(
				...MOVE_DOM_EVENTS.map((event) => {
					window.addEventListener(event, onMove);
					return () => window.removeEventListener(event, onMove);
				}),
			);

			// Attach RELEASE DOM listeners
			unsubArray.push(
				...RELEASE_DOM_EVENTS.map((event) => {
					window.addEventListener(event, onEnd);
					return () => window.removeEventListener(event, onEnd);
				}),
			);

			// Actually move the element
			unsubArray.push(
				draggableElementRef.current.on('move', (offset) => {
					node.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
					console.log('move', node.getBoundingClientRect());
					draggableElementRef.current.setLastKnownElementPosition(node.getBoundingClientRect());
				}),
			);

			return () => unsubArray.forEach((unsub) => unsub());
		}, []),
	);

	const boundingCallbackRef = useSafeRefCallback(
		useCallback((node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			boundingElementRef.current.setLastKnownBounds(node.getBoundingClientRect());

			const onResize = (entries: ResizeObserverEntry[]) => {
				const firstEntry = entries[0];
				if (!firstEntry) {
					return;
				}

				boundingElementRef.current.resize(firstEntry.contentRect);
			};

			const observer = new ResizeObserver(onResize);
			observer.observe(node);

			return () => observer.disconnect();
		}, []),
	);

	useEffect(() => {
		const unsubArray: OffCallbackHandler[] = [];

		unsubArray.push(
			handleElementRef.current.onGrab((mousePosition) => {
				console.log('grab', mousePosition);
				draggableElementRef.current.handleGrab(mousePosition, draggableElementRef.current.getLastKnownElementPosition());
			}),
		);

		unsubArray.push(
			draggableElementRef.current.on('release', (rect) => {
				console.log('release', rect);
				const offset = calculateBoundsOffset(rect, boundingElementRef.current.getLastKnownBounds());
				console.log(rect, boundingElementRef.current.getLastKnownBounds(), offset);
				draggableElementRef.current.moveByOffset(offset);
			}),
		);

		unsubArray.push(
			boundingElementRef.current.onResize((rect) => {
				console.log('resize', rect);
				const offset = calculateBoundsOffset(draggableElementRef.current.getLastKnownElementPosition(), rect);
				draggableElementRef.current.moveByOffset(offset);
			}),
		);

		return () => unsubArray.forEach((unsub) => unsub());
	}, []);

	return [draggableCallbackRef, boundingCallbackRef, handleElementCallbackRef];
};
