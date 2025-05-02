import { Emitter, OffCallbackHandler } from '@rocket.chat/emitter';
import { useSafeRefCallback } from '@rocket.chat/ui-client';
import { useCallback, useRef } from 'react';

const DRAG_START_EVENTS = ['pointerdown' /* , 'touchstart' */] as const;
const DRAG_END_EVENTS = ['pointerup', 'pointercancel'] as const;
const DRAG_MOVE_EVENTS = ['pointermove' /* , 'touchmove' */] as const;

const isLeftClick = (e: PointerEvent) => e.button === 0;

// holds the HTMLElement - should not be here
// attaches DOM events - should not be here
// emits events - This is ok.
class HandleElement extends Emitter<{
	dragStart: { clientX: number; clientY: number };
}> {
	private element: HTMLElement;

	private cleanup: (() => void) | null = null;

	constructor(element: HTMLElement) {
		super();
		this.element = element;
	}

	_onDragStart(e: PointerEvent): void {
		if (!isLeftClick(e)) {
			return;
		}

		const { clientX, clientY } = e;
		this.emit('dragStart', { clientX, clientY });
	}

	public onDragStart(cb: (mousePos: { clientX: number; clientY: number }) => void): OffCallbackHandler {
		if (!this.cleanup) {
			const onDragStart = this._onDragStart.bind(this);
			DRAG_START_EVENTS.forEach((event) => {
				this.element.addEventListener(event, onDragStart);
			});

			this.cleanup = () => {
				DRAG_START_EVENTS.forEach((event) => {
					this.element.removeEventListener(event, onDragStart);
				});
			};
		}

		const offCb = this.on('dragStart', cb);

		return () => {
			offCb();
			if (!this.has('dragStart')) {
				this.cleanup?.();
				this.cleanup = null;
			}
		};
	}
}

type DraggableElementOptions = {
	handle?: HTMLElement;
	restorePosition?: DOMRect;
};

// holds the HTMLElement - should not be here
// attaches DOM events - should not be here
// handles DOM node manipulation - should not be here
// returns the clientRect - shouold not be here
// emits events - This is ok.
// handles offset (mouse/touch) logic - This is ok.
//
class DraggableElement extends Emitter<{
	dragStart: DOMRect;
	dragEnd: DOMRect;
}> {
	private element: HTMLElement;

	private isDragging = false;

	private offsetX = 0;

	private offsetY = 0;

	private currentTransform: {
		x: number;
		y: number;
	} = {
		x: 0,
		y: 0,
	};

	constructor(element: HTMLElement, { restorePosition }: DraggableElementOptions = {}) {
		super();
		this.element = element;
		if (restorePosition) {
			this.restorePosition(restorePosition);
		}
	}

	private restorePosition(position: DOMRect): void {
		const currentPosition = this.getBoundingClientRect();
		this.setOffset(position.x - currentPosition.x, position.y - currentPosition.y);
	}

	init(): () => void {
		const onDragMove = this.onDragMove.bind(this);
		const onDragEnd = this.onDragEnd.bind(this);

		DRAG_MOVE_EVENTS.forEach((event) => {
			document.addEventListener(event, onDragMove);
		});
		DRAG_END_EVENTS.forEach((event) => {
			document.addEventListener(event, onDragEnd);
		});

		return () => {
			DRAG_MOVE_EVENTS.forEach((event) => {
				document.removeEventListener(event, onDragMove);
			});
			DRAG_END_EVENTS.forEach((event) => {
				document.removeEventListener(event, onDragEnd);
			});
		};
	}

	public handleDragStart({ clientX, clientY }: { clientX: number; clientY: number }): void {
		this.isDragging = true;
		const rect = this.getBoundingClientRect();
		this.setMouseOffset(clientX, clientY);
		this.emit('dragStart', rect);
	}

	private onDragMove(e: PointerEvent): void {
		if (!this.isDragging) return;

		const { clientX, clientY } = e;

		const x = clientX - this.offsetX;
		const y = clientY - this.offsetY;

		this.addTransformOffset(x, y);
		this.setMouseOffset(clientX, clientY);
	}

	private onDragEnd(): void {
		this.isDragging = false;
		const rect = this.getBoundingClientRect();
		this.setMouseOffset(0, 0);
		this.emit('dragEnd', rect);
	}

	private setOffset(x: number, y: number): void {
		this.currentTransform.x = x;
		this.currentTransform.y = y;

		this.element.style.transform = `translate(${this.currentTransform.x}px, ${this.currentTransform.y}px)`;
	}

	private setMouseOffset(x: number, y: number): void {
		this.offsetX = x;
		this.offsetY = y;
	}

	addTransformOffset(x: number, y: number): void {
		this.setOffset(this.currentTransform.x + x, this.currentTransform.y + y);
	}

	getBoundingClientRect(): DOMRect {
		return this.element.getBoundingClientRect();
	}

	getCurrentTransform(): { x: number; y: number } {
		return this.currentTransform;
	}
}

class BoundingElement extends Emitter<{
	resize: void;
}> {
	private element: HTMLElement;

	private timeout: NodeJS.Timeout | null = null;

	private observer: ResizeObserver | null = null;

	constructor(element: HTMLElement) {
		super();
		this.element = element;
	}

	getBoundingClientRect(): DOMRect {
		return this.element.getBoundingClientRect();
	}

	onResize(callback: () => void): OffCallbackHandler {
		if (!this.observer) {
			this.observer = new ResizeObserver(this.handleResizeBoundindElement.bind(this));
			this.observer.observe(this.element);
		}

		const off = this.on('resize', callback);

		return () => {
			off();
			if (!this.has('resize')) {
				this.observer?.disconnect();
				this.observer = null;
			}
		};
	}

	handleResizeBoundindElement(): void {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}

		this.timeout = setTimeout(() => {
			this.emit('resize');
		}, 250);
	}
}

function bindDraggableElement(draggableElement: DraggableElement, bounds: DOMRect): void {
	const rect = draggableElement.getBoundingClientRect();

	// If the draggable element's top/left position is less than
	// the bounding element's top/left position, the difference will be positive
	// This means we can just add this value to the draggable element's offset
	// to bring it back into bounds
	const topLeftPoint = {
		x: bounds.left - rect.left,
		y: bounds.top - rect.top,
	};

	// If the draggable element's bottom/right position is greater than
	// the bounding element's bottom/right position, the difference will be negative
	// This means we can just add this value to the draggable element's offset
	// to bring it back into bounds
	const bottomRightPoint = {
		x: bounds.right - rect.right,
		y: bounds.bottom - rect.bottom,
	};

	let changed = false;
	if (topLeftPoint.x > 0) {
		draggableElement.addTransformOffset(topLeftPoint.x, 0);
		changed = true;
	}
	if (topLeftPoint.y > 0) {
		draggableElement.addTransformOffset(0, topLeftPoint.y);
		changed = true;
	}
	if (bottomRightPoint.x < 0) {
		draggableElement.addTransformOffset(bottomRightPoint.x, 0);
		changed = true;
	}
	if (bottomRightPoint.y < 0) {
		draggableElement.addTransformOffset(0, bottomRightPoint.y);
		changed = true;
	}

	if (changed) {
		draggableElement.emit('dragEnd', draggableElement.getBoundingClientRect());
	}
}

export const useDraggable = () => {
	const draggableElementRef = useRef<DraggableElement | null>(null);
	const boundingElementRef = useRef<BoundingElement | null>(null);
	const handleElementRef = useRef<HandleElement | null>(null);
	const restorePositionRef = useRef<DOMRect | null>(null);

	const handleElementCallbackRef = useSafeRefCallback(
		useCallback((node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			const handleElement = new HandleElement(node);
			handleElementRef.current = handleElement;

			return handleElement.onDragStart(({ clientX, clientY }) => {
				if (!draggableElementRef.current) {
					return;
				}

				draggableElementRef.current.handleDragStart({ clientX, clientY });
			});
		}, []),
	);

	const draggableCallbackRef = useSafeRefCallback(
		useCallback((node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			const draggableElement = new DraggableElement(node, { restorePosition: restorePositionRef.current || undefined });
			draggableElementRef.current = draggableElement;

			// TODO: Fix this, mimic onDragStart from HandleElement
			const offNodeListeners = draggableElement.init();

			const off = draggableElement.on('dragEnd', (rect) => {
				restorePositionRef.current = rect;

				if (!boundingElementRef.current) {
					return;
				}
				bindDraggableElement(draggableElement, boundingElementRef.current.getBoundingClientRect());
			});

			return () => {
				offNodeListeners();
				off();
			};
		}, []),
	);

	const boundingCallbackRef = useSafeRefCallback(
		useCallback((node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			const boundingElement = new BoundingElement(node);
			boundingElementRef.current = boundingElement;

			return boundingElement.onResize(() => {
				if (!draggableElementRef.current) {
					return;
				}
				bindDraggableElement(draggableElementRef.current, boundingElement.getBoundingClientRect());
			});
		}, []),
	);

	return [draggableCallbackRef, boundingCallbackRef, handleElementCallbackRef];
};

// one hook for each element
// Manager Class (attach events and handle interactions)
// Abstract class and extended classes for each element

/**
 * I have to separate the concepts:
 * Base classes are responsible for emitting events
 * Base classes should not know about the DOM
 * Base Classes should not know about each other
 *
 * Dom manipulation could be a controlled state. This has the downside of having to wait for rerendering and can be heavy.
 * At least there should be the option to either be controlled or uncontrolled, and the base classes should support this.
 *
 * I could emit events and have a middleware to apply the changes to the DOM.
 * I could pass a function that receives the transform offset and applies it to the DOM.
 *
 * Now I have a few choices:
 * 1. Extend the Base class for each element, which handles the DOM
 * 2. Static class with methods for DOM Element
 * 3. Hooks for each element (not sure about this one)
 * 4.
 */
